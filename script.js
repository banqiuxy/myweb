const date = new Date();
// const launchDate = new Date(2021, 5, 25);
// const daysRunning = Math.floor((date - launchDate) / (1000 * 60 * 60 * 24));
document.querySelector('.copyright').textContent = `Copyright © ${date.getFullYear()} 半秋. All rights reserved. \n Since 2021`;

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

function copyLinkme() {
    const snackbar = document.querySelector(".example-snackbar");
    const textToCopy = "banqiuxy";
    const tempInput = document.createElement("input");
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    //alert("复制成功！");
    snackbar.open = true;
}
