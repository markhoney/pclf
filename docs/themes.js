
function setTheme(theme) {
	if (theme) localStorage.setItem('theme', theme);
	else theme = localStorage.getItem('theme') || 'propaganda';
	document.getElementById('theme').href = `/css/${theme}.css`;
}

setTheme();
