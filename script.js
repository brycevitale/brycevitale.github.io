$(document).ready(function () {
  const path = window.location.pathname.split("/").pop();
  $('.nav-link').each(function () {
    if ($(this).attr('href') === path) {
      $(this).addClass('active');
    }
  });

  $('#contactForm').on('submit', function (e) {
    e.preventDefault();
    $('<div class="alert alert-success mt-3">Thanks for your message!</div>')
      .hide()
      .appendTo('form')
      .fadeIn();
    this.reset();
  });
})