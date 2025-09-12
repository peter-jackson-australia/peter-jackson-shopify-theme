document.querySelectorAll('.main-tab-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.main-tab-button').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));

    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`${tabId}-left`).classList.add('active');
  });
});

document.querySelectorAll('.size-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.size-button').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.size-content').forEach((content) => content.classList.remove('active'));

    button.classList.add('active');
    const sizeType = button.getAttribute('data-size');
    document.getElementById(`${sizeType}-table`).classList.add('active');
  });
});