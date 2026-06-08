

export const EXERCISES_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

export const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export const CATEGORY_COLORS = {
  strength:   'badge-purple',
  stretching: 'badge-cyan',
  cardio:     'badge-amber',
  powerlifting: 'badge-red',
  plyometrics:'badge-green',
  olympic_weightlifting: 'badge-red',
};

export const LEVEL_COLORS = {
  beginner:     'badge-green',
  intermediate: 'badge-amber',
  expert:       'badge-red',
};

export function getExerciseImageUrl(imagePath) {
  if (!imagePath) return null;
  
  return IMAGE_BASE_URL + encodeURIComponent(imagePath).replace(/%2F/g, '/');
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatCategoryLabel(cat) {
  if (!cat) return '';
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
