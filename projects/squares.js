"use strict";

window.addEventListener("load",function() {

/* a10 : variante de a09 lignes mono tiers 38
  La probabilité de chaque genre est proportionnelle au nombre de variantes (rotations) qu'il admet
chaque Carre a son propre canvas pour permettre l'animation par rotation des canv
*/
  let canv, ctx;
  let maxx, maxy;
  let left0, top0;
  let periodx, periody;

  const coca = 64; // côté carré - multiple de 8 de préférence
  const r6 = coca / 8; // plus petit rayon
  const r3 = coca * 3 / 8; // rayon intermédiaire
  const r23 = coca * 5 / 8; // grand rayon

  const epTrait = 2; // épaisseur tracé
  let nbx, nby; // nb de carrés horiz. / vert.
  let terrain;
  let tbOrient;

  let coulFond;
  let coulTrait;

// pour éviter de toujours écrire Math.
  const mrandom = Math.random;
  const mfloor = Math.floor;
  const mround = Math.round;
  const mabs = Math.abs;
  const mmin = Math.min;
  const mmax = Math.max;

  const mPI = Math.PI;
  const mPIS2 = Math.PI / 2;
  const m2PI = Math.PI * 2;
  const msin = Math.sin;
  const mcos = Math.cos;
  const matan2 = Math.atan2;

  const mhypot = Math.hypot;
  const msqrt = Math.sqrt;

//------------------------------------------------------------------------
// classe Carre

function Carre (kx, ky, ale) {

  this.kx = kx;
  this.ky = ky;

  switch (ale) {
    case 0: this.genre = 0; this.rotation = 0; break;
    case 1:
    case 2: this.genre = 1; this.rotation = ale - 1; break;
    case 3:
    case 4: this.genre = 2; this.rotation = ale - 3; break;
    case 5:
    case 6:
    case 7:
    case 8: this.genre = 3; this.rotation = ale - 5; break;
    case 9:
    case 10:
    case 11:
    case 12: this.genre = 4; this.rotation = ale - 9; break;
  }
//  this.genre = alea(0, 5, true); // 0 à 4
//  this.rotation = alea(0, 4,true);    // 0 à 3
// en fait, genre 0 n'a qu'une seule rotation possible ; genres 1 et 2 en ont 2

// quatre coins
  this.x0 = 0;
  this.x1 = this.x0 + coca ;
  this.y0 = 0;
  this.y1 = this.y0 + coca ;

// milieux des côtés
  this.xm = (this.x0 + this.x1) / 2;
  this.ym = (this.y0 + this.y1) / 2;

// tiers des côtés
  this.x13 = (this.x0 * 5 + this.x1 * 3) / 8;
  this.x23 = (this.x0 * 3 + this.x1 * 5) / 8;
  this.y13 = (this.y0 * 5 + this.y1 * 3) / 8;
  this.y23 = (this.y0 * 3 + this.y1 * 5) / 8;

  this.canv= document.createElement('canvas');
//    canv.style.backgroundColor='#FFE';
  this.canv.style.position="absolute";
//    canv.addEventListener('click',clickCanvas);
  this.canv.style.left = left0 + kx * coca + 'px';
  this.canv.style.top = top0 + ky * coca + 'px';
  this.canv.width = coca;
  this.canv.height = coca;

  document.body.appendChild(this.canv);
  this.ctx=this.canv.getContext('2d');
  this.ctx.linecap = 'round';
  this.ctx.strokeStyle = coulTrait;
  this.ctx.lineWidth = epTrait;

  this.orient = 0; // orientation initiale;

} // function Carre

Carre.prototype.rendCoin = function (coin) {
  return [[this.x0, this.y0], [this.x1, this.y0], [this.x1, this.y1], [this.x0, this.y1]][coin];
};

Carre.prototype.rendMilieu = function (bord) {
  return [[this.xm, this.y0], [this.x1, this.ym], [this.xm, this.y1], [this.x0, this.ym]][bord];
};

Carre.prototype.rendTiers = function (bord) {
  return [[this.x13, this.y0, this.x13, this.y1],
          [this.x1, this.y13, this.x0, this.y13],
          [this.x23, this.y1, this.x23, this.y0],
          [this.x0, this.y23, this.x1, this.y23]][bord];
};

Carre.prototype.rend2Tiers = function (bord) {
  return [[this.x23, this.y0, this.x23, this.y1],
          [this.x1, this.y23, this.x0, this.y23],
          [this.x13, this.y1, this.x13, this.y0],
          [this.x0, this.y13, this.x1, this.y13]][bord];
};

Carre.prototype.coin13 = function(coin) {
// 0 = centre en haut à gauche
  let [x,y] = this.rendCoin(coin);
  let dAng = coin * mPIS2
  this.ctx.beginPath();
  this.ctx.arc(x, y, r3, 0 + dAng, mPIS2 + dAng);
  this.ctx.stroke();
}

Carre.prototype.coin23 = function(coin) {
// 0 = centre en haut à gauche
  let [x,y] = this.rendCoin(coin);
  let dAng = coin * mPIS2
  this.ctx.beginPath();
  this.ctx.arc(x, y, r23, 0 + dAng, mPIS2 + dAng);
  this.ctx.stroke();
}

Carre.prototype.milieu = function(bord) {
// 0 = centre en haut à gauche
  let [x,y] = this.rendMilieu(bord);
  let dAng = bord * mPIS2
  this.ctx.beginPath();
  this.ctx.arc(x, y, r6, dAng, mPI + dAng);
  this.ctx.stroke();
}

Carre.prototype.vertic13 = function(bord) {
// 0 = centre en haut à gauche
  let [x0, y0, x1, y1] = this.rendTiers(bord);
  this.ctx.beginPath();
  this.ctx.moveTo (x0, y0);
  this.ctx.lineTo (x1, y1);
  this.ctx.stroke();
}

Carre.prototype.vertic23 = function(bord) {
// 0 = centre en haut à gauche
  let [x0, y0, x1, y1] = this.rend2Tiers(bord);
  this.ctx.beginPath();
  this.ctx.moveTo (x0, y0);
  this.ctx.lineTo (x1, y1);
  this.ctx.stroke();
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Carre.prototype.dessiner = function() {

// quatre coins
  let x0 = coca * this.kx;
  let x1 = x0 + coca ;
  let y0 = coca * this.ky;
  let y1 = y0 + coca ;

// milieux des côtés
  let xm = (x0 + x1) / 2;
  let ym = (y0 + y1) / 2;

// tiers des côtés
  let x13 = (x0 * 2 + x1) / 3;
  let x23 = (x0 + x1 * 2) / 3;
  let y13 = (y0 * 2 + y1) / 3;
  let y23 = (y0 + y1 * 2) / 3;

  let idxtra = (this.genre * 4 ) + this.rotation;

  switch (this.genre) {

    case 0 :
      this.coin13(0);
      this.coin13(1);
      this.coin13(2);
      this.coin13(3);
      break;

    case 1 :
      this.coin13(this.rotation);
      this.coin23(this.rotation);
      this.coin13(this.rotation ^ 2);
      this.coin23(this.rotation ^ 2);
      break;

    case 2 :
      this.milieu(this.rotation ^ 1);
      this.milieu(this.rotation ^ 3);
      this.vertic13(this.rotation);
      this.vertic23(this.rotation);
      break;

    case 3 :
      this.milieu((this.rotation + 3) % 4);
      this.vertic13(this.rotation);
      this.coin13((this.rotation + 1) % 4);
      this.coin13(this.rotation ^ 2);
      break;

    case 4 :
      this.coin13(this.rotation);
      this.coin23(this.rotation);
      this.milieu((this.rotation + 1) % 4);
      this.milieu(this.rotation ^ 2);
      break;
  } // switch
  
} // Carre.dessiner

// fin classe Carre
//------------------------------------------------------------------------

function toutDessiner() {

  for (let ky = 0; ky < nby ; ++ky) {
    for (let kx = 0; kx < nbx ; ++kx) {
      terrain[ky][kx].dessiner();
    } // for kx
  } // for ky

} // function toutDessiner

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


function Redemarrer() {

  let hue1, hue2;
// couleurs au hasard
  hue1 = alea(0,360);
  hue2 = (hue1 + alea (60,300)) % 360;

  coulTrait = `hsl(${hue1}, 100%, 60%)`;
  coulFond = `hsl(${hue2}, 100%, 10%)`;

  maxx = window.innerWidth - 8; // garantit marge mini de 4
  maxy = window.innerHeight - 8; // garantit marge mini de 4

  nbx = mfloor(maxx / coca);
  maxx = coca * nbx;

  nby = mfloor(maxy / coca);
  maxy = coca * nby;

  left0 = (window.innerWidth  - maxx) / 2 ;
  top0 = (window.innerHeight - maxy) / 2 ;

// crétion de motif répétitif
  periody = alea (5,10,true);
  periodx = alea (5,10,true);
  let tbPer = [];
  tbOrient = []
  for (let ky = 0; ky < periody; ++ky) {
    let ligne = [];
    tbOrient[ky] = [];
    for (let kx = 0; kx < periodx; ++kx) {
      ligne[kx] = alea(0, 13, true);
      tbOrient[ky][kx] = {orient:0, carres:[]};
    } // for kx
    tbPer[ky] = ligne;
  } // for ky

  document.body.innerHTML = ''; // on nettoie tout
  terrain=[];
  for (let ky = 0; ky < nby ; ++ky) {
    terrain[ky]=[];
    for (let kx = 0; kx < nbx ; ++kx) {
      let kperx = (kx + 2 * mfloor(ky / periody)) % periodx;
      let kpery = ky % periody;
      terrain[ky][kx] = new Carre(kx, ky, tbPer[kpery][kperx]);
      tbOrient[kpery][kperx].carres.push ([kx, ky]);
    } // for kx
  } // for ky
  toutDessiner();
//  animer()
} // Redemarrer

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function alea (mini,maxi,entier) {
// entrée : mini et maxi nombres, avec maxi > mini (non vérifié)
// rend un nombre théoriquement entre mini inclus et maxi exclus
// si 'entier' absent ou == false :
//   rend un flottant
// si 'entier' == true
//   mini et maxi doivent être des entiers
//   la valeur rendue est entière
  let x = mini + mrandom() * (maxi - mini);
  if (entier) return mfloor(x);
  return x;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function animer() {

  for (let k= 0; k < 3 ; ++k) {
    let kperx = alea(0, periodx, true);
    let kpery = alea(0, periody, true);
    let objOrient = tbOrient[kpery][kperx];
    let nouvOrient = `rotate(${90 * ++objOrient.orient}deg)` ; // on fait varier l'orientation

    objOrient.carres.forEach ( carre => {
      let carr = terrain[carre[1]][carre[0]];
      carr.canv.style.transform = nouvOrient;
    });
  }
  setTimeout(animer, 3000);
} // animer
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

 
//------------------------------------------------------------------------
//------------------------------------------------------------------------
// début d'exécution

  document.body.style.backgroundColor = coulFond;
  Redemarrer();
  animer();
  window.addEventListener('resize',Redemarrer);
  window.addEventListener('click',Redemarrer);

}); // window load listener

