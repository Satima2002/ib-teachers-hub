/* Реестр модулей. Чтобы добавить тему: создайте courses/<id>.js (по образцу loops.js)
   и допишите <id> в COURSE_FILES. Порядок = порядок карточек на странице курса. */
window.COURSES = [];
window.COURSE = null;
window.COURSE_FILES = ["basics", "conditions", "loops", "game"];
function registerCourse(c){ window.COURSES.push(c); window.COURSE = c; }
