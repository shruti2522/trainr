import React, { useState, useEffect, useRef } from 'react';
import { extractPreferencesFromText, generateFollowUp } from '../../../services/geminiService';
import './Chat.css';

const INITIAL_QUESTION = "Hey! What's your main fitness goal right now?";
const INITIAL_SUGGESTIONS = [
  "Lose weight & tone up",
  "Build muscle",
  "Improve endurance",
  "General health & fitness"
];

const TOTAL_STEPS = 3;

function validateGoal(text) {
  if (text.trim().length < 2) {
    return "Just a word or two is fine — what are you hoping to achieve? 💪";
  }
  return null;
}

const FREQUENCY_PATTERNS = [
  /\b(\d+)\s*(?:x|times?|days?|sessions?)\b/i,
  /\b(once|twice|three|four|five|six|seven|daily|every\s+day)\b/i,
  /\b(mon|tue|wed|thu|fri|sat|sun)\b/i,
  /\bweekly\b/i,
];

const EQUIPMENT_PATTERNS = [
  /\b(gym|dumbbell|dumbbells|barbell|kettlebell|machine|cable|rack|bench|weights?)\b/i,
  /\b(bodyweight|body\s*weight|calisthenics|no\s*equip|home)\b/i,
  /\b(band|bands|resistance|pull.?up|bar|trx)\b/i,
  /\b(full|minimal|basic|limited|no)\s*(gym|equip|equipment|gear|weights?)\b/i,
];

function hasFrequency(text) {
  return FREQUENCY_PATTERNS.some(re => re.test(text));
}

function hasEquipment(text) {
  return EQUIPMENT_PATTERNS.some(re => re.test(text));
}

function validateSchedule(text) {
  const freq = hasFrequency(text);
  const equip = hasEquipment(text);

  if (!freq && !equip) {
    return {
      missing: 'both',
      prompt: "Almost there — could you also tell me how many days a week you can train, and what equipment you have access to?",
      chips: ["3 days, dumbbells", "4 days, full gym", "5 days, bodyweight only"],
    };
  }
  if (!freq) {
    return {
      missing: 'frequency',
      prompt: "Got the equipment part — how many days a week are you able to train?",
      chips: ["2–3 days", "4 days", "5–6 days", "Every day"],
    };
  }
  if (!equip) {
    return {
      missing: 'equipment',
      prompt: "And what equipment do you have access to?",
      chips: ["No equipment (bodyweight)", "Dumbbells at home", "Full gym", "Resistance bands"],
    };
  }
  return null; // all good
}

const SESSION_DURATION_PATTERNS = [
  /\b(15|20|25|30|45|60|90)\s*(–|-|to)?\s*(30|45|60)?\s*(min|minute|minutes)?\b/i,
  /\b(1\+?\s*hour|hour|hours?)\b/i,
  /\b(quick|short|15_30|30_45|45_60|long|extended)\b/i,
];

function validateSessionDuration(text) {
  const hasDuration = SESSION_DURATION_PATTERNS.some(re => re.test(text));
  if (!hasDuration) {
    return "How long would you like each session to be? (e.g., 30 minutes, 45 minutes, or 1 hour)";
  }
  return null;
}


export default function Chat({ onComplete }) {
  const [step, setStep]                         = useState(0);
  const [messages, setMessages]                 = useState([]);
  const [inputText, setInputText]               = useState('');
  const [isTyping, setIsTyping]                 = useState(false);
  const [isParsing, setIsParsing]               = useState(false);
  const [knownFacts, setKnownFacts]             = useState([]);
  const [conversationHistory, setConversationHistory] = useState('');

  const [scheduleAccum, setScheduleAccum]       = useState('');

  const chatEndRef = useRef(null);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  useEffect(() => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([{
        sender: 'bot',
        text: INITIAL_QUESTION,
        options: INITIAL_SUGGESTIONS,
      }]);
    }, 800);
  }, []);


  const appendBotMessage = (text, options = null) => {
    setMessages(prev => [...prev, { sender: 'bot', text, options }]);
  };

  const appendUserMessage = (text) => {
    setMessages(prev => {
      const msgs = [...prev];
      if (msgs.length > 0) msgs[msgs.length - 1].options = null;
      return [...msgs, { sender: 'user', text }];
    });
  };

  const handleSuggestionClick = (suggestion) => {
    if (isParsing || isTyping) return;
    submitResponse(suggestion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isParsing || isTyping) return;
    submitResponse(inputText.trim());
    setInputText('');
  };


  const submitResponse = async (userText) => {
    appendUserMessage(userText);

    const newHistory = conversationHistory
      ? `${conversationHistory}\n${userText}`
      : userText;
    setConversationHistory(newHistory);

    if (step === 0) {
      const goalError = validateGoal(userText);
      if (goalError) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          appendBotMessage(goalError, INITIAL_SUGGESTIONS);
        }, 600);
        return;
      }

      setStep(1);
      setKnownFacts([userText]);
      setIsTyping(true);
      setIsParsing(true);

      try {
        const followUp = await generateFollowUp(newHistory);
        setIsTyping(false);
        setIsParsing(false);
        appendBotMessage(
          followUp.question || "Got it! How many days a week can you train, and what equipment do you have access to?",
          followUp.suggestions || ["3 days, dumbbells", "4 days, full gym", "5 days, bodyweight only"]
        );
      } catch (err) {
        console.error(err);
        setIsTyping(false);
        setIsParsing(false);
        appendBotMessage(
          "Got it! How many days a week can you train, and what equipment do you have access to?",
          ["3 days, dumbbells", "4 days, full gym", "5 days, bodyweight only"]
        );
      }
      return;
    }

    if (step === 1) {
      const accumulated = scheduleAccum
        ? `${scheduleAccum} ${userText}`
        : userText;

      setScheduleAccum(accumulated);
      setIsTyping(true);
      setIsParsing(true);

      try {
        const testHistory = `User goal: ${knownFacts[0]}\nUser schedule/equipment info: ${accumulated}`;
        const extracted = await extractPreferencesFromText(testHistory);
        
        const hasFreq = extracted?.frequency && extracted.frequency !== '0';
        const hasEquip = extracted?.equipment && extracted.equipment.length > 0;

        setIsTyping(false);
        setIsParsing(false);

        if (hasFreq && hasEquip) {
          setStep(2);
          setKnownFacts(prev => [...prev, accumulated]);
          setTimeout(() => {
            appendBotMessage(
              "How long would you like each session to be?",
              ["15–30 minutes", "30–45 minutes", "45–60 minutes", "1+ hours"]
            );
          }, 300);
          return;
        }

        const scheduleError = validateSchedule(accumulated);
        if (scheduleError) {
          setTimeout(() => {
            appendBotMessage(scheduleError.prompt, scheduleError.chips);
          }, 300);
          return;
        }

        setStep(2);
        setKnownFacts(prev => [...prev, accumulated]);
        setTimeout(() => {
          appendBotMessage(
            "How long would you like each session to be?",
            ["15–30 minutes", "30–45 minutes", "45–60 minutes", "1+ hours"]
          );
        }, 300);

      } catch (err) {
        console.error(err);
        setIsTyping(false);
        setIsParsing(false);

        // Fall back to regex validation on Gemini error
        const scheduleError = validateSchedule(accumulated);
        if (scheduleError) {
          appendBotMessage(scheduleError.prompt, scheduleError.chips);
          return;
        }

        setStep(2);
        setKnownFacts(prev => [...prev, accumulated]);
        setTimeout(() => {
          appendBotMessage(
            "How long would you like each session to be?",
            ["15–30 minutes", "30–45 minutes", "45–60 minutes", "1+ hours"]
          );
        }, 300);
      }
      return;
    }

    if (step === 2) {
      const durationError = validateSessionDuration(userText);
      if (durationError) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          appendBotMessage(durationError, ["15–30 minutes", "30–45 minutes", "45–60 minutes", "1+ hours"]);
        }, 600);
        return;
      }

      setStep(3);
      setKnownFacts(prev => [...prev, userText]);
      setIsParsing(true);
      setIsTyping(true);

      const fullHistory = `${conversationHistory}`;

      try {
        const extracted = await extractPreferencesFromText(fullHistory);
        setIsTyping(false);
        appendBotMessage("Perfect. Building your custom plan...");

        setTimeout(() => {
          onComplete({
            frequency:       extracted?.frequency       || '3',
            goal:            extracted?.goal            || 'general_fitness',
            equipment:       extracted?.equipment?.length   ? extracted.equipment   : ['No equipment (bodyweight)'],
            targetAreas:     extracted?.targetAreas?.length ? extracted.targetAreas : ['full_body'],
            injuries:        extracted?.injuries        || [],
            duration:        extracted?.duration        || '6m_2y',
            sessionDuration: extracted?.sessionDuration || '45_60',
            weeklyTime:      '2_4h',
          });
        }, 1000);

      } catch (err) {
        console.error(err);
        setIsTyping(false);
        setIsParsing(false);
        appendBotMessage("Oops, had trouble with that. Could you try rephrasing?");
        setStep(2); // let them retry
      }
      return;
    }
  };

  /* ─── UI ─── */

  const progressPct   = step === 0 ? 10 : step === 1 ? 50 : step === 2 ? 75 : 95;
  const progressLabel =
    step === 0 ? `Step 1 of ${TOTAL_STEPS}` :
    step === 1 ? `Step 2 of ${TOTAL_STEPS}` :
    step === 2 ? `Step 3 of ${TOTAL_STEPS}` :
    'Almost done…';

  return (
    <div className="chat-container">

      {/* Progress */}
      <div className="chat-progress">
        <span className="chat-progress-label">{progressLabel}</span>
        <div className="chat-progress-track">
          <div className="chat-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <React.Fragment key={idx}>
            <div className={`chat-message-row ${msg.sender}`}>
              {msg.sender === 'bot' && <div className="chat-avatar">T</div>}
              <div className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
            </div>

            {msg.options && idx === messages.length - 1 && !isTyping && (
              <div className="chat-options">
                {msg.options.map((opt, i) => (
                  <button
                    key={i}
                    className="chat-chip"
                    onClick={() => handleSuggestionClick(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}

        {isTyping && (
          <div className="chat-message-row bot">
            <div className="chat-avatar">T</div>
            <div className="chat-bubble bot typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          className="chat-input"
          placeholder="Type your answer..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isParsing || isTyping || messages.length === 0}
          autoFocus
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!inputText.trim() || isParsing || isTyping}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      {knownFacts.length > 0 && (
        <div className="chat-known-bar">
          <span className="chat-known-label">Known</span>
          {knownFacts.map((fact, i) => (
            <span key={i} className="chat-known-tag">{fact}</span>
          ))}
        </div>
      )}

    </div>
  );
}