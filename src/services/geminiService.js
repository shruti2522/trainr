import { GEMINI_API_KEY, GEMINI_API_URL } from '../utils/config';

function buildPrompt(prefs, filteredExercises) {
  const { frequency, duration, goal, targetAreas, equipment, injuries, level, score } = prefs;

  
  
  const GOAL_CATEGORIES = {
    build_muscle:        ['strength', 'powerlifting', 'olympic weightlifting'],
    lose_weight:         ['cardio', 'plyometrics', 'strength'],
    improve_endurance:   ['cardio', 'stretching', 'strength'],
    increase_flexibility:['stretching', 'strength'],
    general_fitness:     ['strength', 'cardio', 'stretching'],
  };
  const TARGET_MUSCLES = {
    upper_body: ['chest','shoulders','biceps','triceps','lats','upper back','traps','forearms'],
    lower_body: ['quadriceps','hamstrings','glutes','calves','abductors','adductors'],
    core:       ['abdominals','obliques','lower back'],
    full_body:  [],
  };

  const goalCats = GOAL_CATEGORIES[goal] || ['strength'];
  const targetMuscles = new Set(
    (targetAreas || []).flatMap((a) => TARGET_MUSCLES[a] || [])
  );

  
  const scored = filteredExercises.map((ex) => {
    let score = 0;
    if (goalCats.includes(ex.category)) score += 2;
    if (targetMuscles.size === 0 || (ex.primaryMuscles || []).some((m) => targetMuscles.has(m))) score += 1;
    return { ex, score };
  });

  
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  
  const exerciseList = scored.slice(0, 70).map(({ ex }) => ({
    id: ex.id,
    name: ex.name,
    primaryMuscles: ex.primaryMuscles,
    category: ex.category,
  }));

  const dayCount = parseInt(frequency, 10) || 3;

  return `You are an expert personal trainer and physical therapist. Create a highly customized ${dayCount}-day workout plan for this user.

USER PROFILE:
- Fitness level: ${level} (score ${score}/10)
- Training frequency: ${frequency} days/week
- Training experience: ${duration.replace('_', ' ')}
- Primary goal: ${goal}
- Target body areas: ${targetAreas.length > 0 ? targetAreas.join(', ') : 'Full Body'}
- Available equipment: ${equipment.length > 0 ? equipment.join(', ') : 'Bodyweight only'}
- Injuries/sensitivities to avoid: ${injuries.length > 0 ? injuries.join(', ') : 'None'}

AVAILABLE EXERCISES (choose from these only, reference by id):
${JSON.stringify(exerciseList, null, 2)}

INSTRUCTIONS:
1. Create exactly ${dayCount} training days.
2. The number of exercises per day is up to you (e.g., 4-8), based on the user's level and the goal.
3. Completely tailor the exercises to the user's primary goal and target areas. DO NOT rely on standard Push/Pull/Legs splits unless it perfectly fits the goal.
4. Provide a holistic blend! If the goal is "Increase Flexibility", provide days focused heavily on stretching and mobility. If "Lose Weight", blend cardio, plyometrics, and strength circuits.
5. Order exercises correctly within each day: compound/heavy/priority movements FIRST, then isolation/accessory work LAST.
6. Assign realistic sets and reps (or duration in seconds) based on the goal:
   - For strength/hypertrophy: use reps (e.g., 8-12)
   - For cardio/stretching/planks: use durationSeconds (e.g., 45s)
   - Include appropriate restSeconds between sets.
7. Write a concise, motivating coaching note for each exercise (1 sentence, focus on form or key benefit).
8. Only use exercises from the provided list (match by id). Do NOT invent new exercises.

RESPOND WITH VALID JSON ONLY. No markdown, no explanation. Use this exact schema:
{
  "days": [
    {
      "dayNumber": 1,
      "label": "Full Body Mobility & Core",
      "focus": "Hip openers, shoulder mobility, and core stability",
      "exercises": [
        {
          "id": "exercise_id_here",
          "sets": 3,
          "reps": null,
          "durationSeconds": 45,
          "restSeconds": 30,
          "note": "Breathe deeply and sink lower into the stretch on each exhale."
        }
      ]
    }
  ]
}`;
}

function mergePlanWithExercises(generatedPlan, filteredExercises) {
  const exerciseMap = new Map(filteredExercises.map((ex) => [ex.id, ex]));

  return generatedPlan.days.map((day) => {
    const exercises = day.exercises
      .map((genEx) => {
        const fullEx = exerciseMap.get(genEx.id);
        if (!fullEx) return null; 
        return {
          ...fullEx,
          
          sets: genEx.sets,
          reps: genEx.reps,
          durationSeconds: genEx.durationSeconds,
          restSeconds: genEx.restSeconds,
          note: genEx.note,
        };
      })
      .filter(Boolean);

    return {
      key: day.label.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + day.dayNumber,
      dayNumber: day.dayNumber,
      label: day.label,
      focus: day.focus,
      exercises,
    };
  });
}

export async function generatePlan(prefs, filteredExercises) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('API key is missing or invalid. Please add your Gemini API key to .env.local and restart the server.');
  }

  const prompt = buildPrompt(prefs, filteredExercises);

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API Error:', errText);
    throw new Error(`Failed to generate plan. Status: ${response.status}. Check your API quota or key restrictions.`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Received an empty response. Please try again.');
  }

  
  const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
  let generatedPlan;
  try {
    generatedPlan = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('The server returned an improperly formatted plan. Please try again.');
  }

  if (!generatedPlan?.days || !Array.isArray(generatedPlan.days) || generatedPlan.days.length === 0) {
    throw new Error('The server did not return a valid day structure. Please try again.');
  }

  const plan = mergePlanWithExercises(generatedPlan, filteredExercises);
  
  if (plan.length === 0 || plan.every(day => day.exercises.length === 0)) {
    throw new Error('The server failed to map any exercises successfully. Please try again.');
  }

  return plan;
}
