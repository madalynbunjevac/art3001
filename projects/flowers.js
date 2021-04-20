document.addEventListener('DOMContentLoaded', () => {

    // ==== ELEMENTS ==== //
  
    const container = document.querySelector('.container');
    const stealThis = document.querySelector('.steal-this');
  
    // Game Over box
    const messageBox = document.querySelector('.message-box'),
          messageTitle = document.querySelector('.message-title'),
          message = document.querySelector('.message'),
          closeBtn = document.querySelector('.close-btn');
  
    // Lasers
    const vLasers = document.querySelectorAll('.v-laser'),
          hLasers = document.querySelectorAll('.h-laser');
    
    let vIndex, hIndex; // used to check if touching laser
  
    // Laser positions 
    // Get added once ruby is clicked to account for window resizing
    let vLasersPos = [];
    let hLasersPos = [];
    
    // Ruby divs
    const ruby = document.querySelector('.ruby-wrap'),
          upperLeft = document.querySelector('.r-upper-left'),
          upperMiddle = document.querySelector('.r-upper-middle'),
          upperRight = document.querySelector('.r-upper-right');
  
    // Ruby Colors
    // Colors start with red, light red, highlight red, and then shadow red.
    const rubyColors = ['#bd2222', '#de4040', '#fa6161', '#a31414'];
  
    const color0 = `40px solid ${rubyColors[0]}`,
          color1 = `40px solid ${rubyColors[1]}`,
          color2 = `40px solid ${rubyColors[2]}`;
  
    let isGameOver = false;
    let flashLasers;
  
    // ==== FUNCTIONS ==== //
  
    // Ruby Rotation Fns
    function changeColors() {
      upperLeft.style.borderBottom = color0;
      upperMiddle.style.borderTop = color1;
      upperRight.style.borderBottom = color2;
      setTimeout(() => {
        upperLeft.style.borderBottom = color2;
        upperMiddle.style.borderTop = color1;
        upperRight.style.borderBottom = color0;
        }, 500);
    }
  
    function rotateRuby() {
      setInterval(() => {
        changeColors();
      }, 1000);
    }
    
    rotateRuby();
  
    // Ruby grab and drag
    function dragRuby(elmnt) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      if (document.querySelector('.ruby')) {
        document.querySelector('.ruby').onmousedown = dragMouseDown();
      } else {
        elmnt.onmousedown = dragMouseDown();
      }
  
      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves
        document.onmousemove = elementDrag;
      }
  
      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }
  
      function closeDragElement() {
        // stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
  
    function checkforGameOver() {
      // Get border of ruby
      const rect = ruby.getBoundingClientRect();
      const newRectBottom = rect.bottom - 35; // account for shadow
      // Check if ruby is overlapping an "on" horizontal laser
      if (vLasersPos[vIndex] <= rect.right && vLasersPos[vIndex] >= rect.left) {
        clearInterval(flashLasers);
        ruby.style.display = 'none';
        gameOver('laser');
      }
      // Check if ruby is overlapping an "on" vertical laser
      if (hLasersPos[hIndex] >= rect.top && hLasersPos[hIndex] <= newRectBottom) {
        clearInterval(flashLasers);
        ruby.style.display = 'none';
        gameOver('laser');
      }
      // Check for win
      if (
        rect.left <= 0 ||
        rect.right >= window.innerWidth ||
        rect.top <= 0 ||
        newRectBottom >= window.innerHeight
      ) {
        clearInterval(flashLasers);
        ruby.style.display = 'none';
        win();
      }
    }
  
    // Flash Lasers Randomly
    function displayLasers() {
        // Change background and hide text
        container.style.background = 'linear-gradient(30deg, #ff0000, #ffccff)';
        stealThis.style.visibility = 'hidden';
        // Display lasers 
        vLasers.forEach(laser => laser.style.display = 'block');
        hLasers.forEach(laser => laser.style.display = 'block');
        // Get Laser positions - pushed into arrays
        vLasers.forEach(laser => vLasersPos.push(laser.offsetLeft));
        hLasers.forEach(laser => hLasersPos.push(laser.offsetTop));
        // Then display one random vertical and one random horizontal laser at a time
        flashLasers = setInterval(() => {
          let randomI = Math.floor(Math.random() * 6);
          let randomJ = Math.floor(Math.random() * 6);
    
          setTimeout(() => {
            for (i = 0; i < vLasers.length; i++) {
              if (i === randomI) {
                vLasers[i].style.display = 'block';
                vIndex = i; // assigning which num in array to "display" as on
              } else {
                vLasers[i].style.display = 'none';
              }
            }
          }, 100);
    
          setTimeout(() => {
            for (j = 0; j < hLasers.length; j++) {
              if (j === randomJ) {
                hLasers[j].style.display = 'block';
                hIndex = j; // assigning which num in array to "display" as on
              } else {
                hLasers[j].style.display = 'none';
              }
            }
          }, 200);
          
        }, 200);
      
    }
  
    function gameOver(id) {
      isGameOver = true;
      if (isGameOver) {
        messageBox.style.display = 'block';
        messageTitle.textContent = 'Game Over:'
      } 
      if (id === 'drop') {
        ruby.style.display = 'none';
        message.textContent = 'You dropped the ruby.'
      } else if (id === 'laser') {
        message.textContent = 'You ran into a security laser.'
      } 
    }
  
    function win() {
      isGameOver = true;
      if (isGameOver) {
        messageBox.style.display = 'block';
        messageTitle.textContent = 'You Win!';
        message.textContent = 'Congratulations, you are a thief.'
      }
    }
  
    function reset() {
      isGameOver = false;
      vLasersPos = [];
      hLasersPos = [];
      vLasers.forEach(laser => laser.style.display = 'none');
      hLasers.forEach(laser => laser.style.display = 'none');
      messageBox.style.display = 'none';
      container.style.background = '#8f9bbc';
      // reset the ruby in the center
      ruby.style.display = 'block';
      ruby.style.top = '50%';
      ruby.style.left = '50%';
      ruby.style.transform = 'translate(-50%, -50%)';
      stealThis.style.visibility = 'visible';
    }
  
    // ==== EVENT LISTENERS ==== //
    ruby.addEventListener('mousedown', () => {
      displayLasers();
      dragRuby(ruby);
    });
  
    ruby.addEventListener('mousemove', () => checkforGameOver());
  
    ruby.addEventListener('mouseup', () => {
      if (isGameOver) {
        return;
      } else {
        gameOver('drop');
      };
      clearInterval(flashLasers);
    });
  
    closeBtn.addEventListener('click', () => reset());
  
    // Mobile
    // ruby.addEventListener('touchstart', () => {
    //   displayLasers();
    //   dragRuby(ruby);
    // });
  
    // ruby.addEventListener('touchmove', () => checkforGameOver());
  
    // ruby.addEventListener('touchend', () => {
    //   if (isGameOver) {
    //     return;
    //   } else {
    //     gameOver('drop');
    //   };
    //   clearInterval(flashLasers);
    // });
  
    // closeBtn.addEventListener('touchstart', () => reset());
  });