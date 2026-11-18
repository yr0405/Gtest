const tripNavigation = document.querySelector('.grouped-nav');
const groups = [...tripNavigation.querySelectorAll('.nav-group')];

function closeGroups(except) {
  for (const group of groups) {
    if (group !== except) group.open = false;
  }
}

for (const group of groups) {
  group.addEventListener('toggle', () => {
    if (group.open) closeGroups(group);
  });
}

document.addEventListener('click', (event) => {
  if (!tripNavigation.contains(event.target) || event.target.closest('.nav-links a')) {
    closeGroups();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openGroup = groups.find((group) => group.open);
  if (!openGroup) return;
  closeGroups();
  openGroup.querySelector('summary').focus();
});
