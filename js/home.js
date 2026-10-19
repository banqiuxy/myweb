// ============ 年份动态计算 ============
const year = new Date().getFullYear();
const diffYears = year - 2017;
const chineseDigits = ['零','一','二','三','四','五','六','七','八','九'];
function toChineseNum(n) {
  if (n < 10) return chineseDigits[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    let s = (ten === 1 ? '十' : chineseDigits[ten] + '十');
    if (one !== 0) s += chineseDigits[one];
    return s;
  }
  return String(n);
}
document.getElementById('years').textContent = toChineseNum(diffYears) + '年';
document.getElementById('age').textContent = year - 2008;
document.getElementById('copyYear').textContent = year;

// ============ 签名打字机 ============
const sloganText = 'Please give me the courage to face everything';
const sloganEl = document.getElementById('sloganText');
let charIndex = 0;
const typingTimer = setInterval(function () {
  sloganEl.textContent = sloganText.slice(0, charIndex + 1);
  charIndex++;
  if (charIndex >= sloganText.length) clearInterval(typingTimer);
}, 120);

// ============ 移动端汉堡菜单 ============
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
hamburger.addEventListener('click', function () {
  const open = navMenu.classList.toggle('open');
  hamburger.classList.toggle('active', open);
  hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
});
navMenu.querySelectorAll('a').forEach(function (link) {
  link.addEventListener('click', function () {
    hamburger.classList.remove('active');
    navMenu.classList.remove('open');
  });
});

// ============ 滚动时高亮当前导航 ============
const sections = document.querySelectorAll('section[id], header[id]');
const navLinks = document.querySelectorAll('.nav-link');
const navObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      navLinks.forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(function (s) { navObserver.observe(s); });

// ============ 轻提示 ============
const toast = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
}

// ============ 复制功能 ============
function copyText(text, msg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast(msg); }).catch(function () { fallbackCopy(text, msg); });
  } else { fallbackCopy(text, msg); }
}
function fallbackCopy(text, msg) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); showToast(msg); }
  catch (e) { alert('复制失败，请手动复制：' + text); }
  document.body.removeChild(ta);
}
document.getElementById('copyWechat').addEventListener('click', function () { copyText('banqiuxy', '复制成功'); });
document.querySelectorAll('.copy-link[data-copy]').forEach(function (el) {
  if (el.id !== 'copyWechat') {
    el.addEventListener('click', function () { copyText(el.getAttribute('data-copy'), '复制成功'); });
  }
});

// ============ 滚动进入动画 ============
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(function (el) { revealObserver.observe(el); });
} else {
  revealEls.forEach(function (el) { el.classList.add('in'); });
}
