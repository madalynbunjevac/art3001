/*
  _    _ _   _ _ _ _        _          
 | |  | | | (_) (_) |      (_)         
 | |  | | |_ _| |_| |_ __ _ _ _ __ ___ 
 | |  | | __| | | | __/ _` | | '__/ _ \
 | |__| | |_| | | | || (_| | | | |  __/
  \____/ \__|_|_|_|\__\__,_|_|_|  \___|
                                       
*/
var Utl = {};
// true si valeur est entre deux autres valeurs
Utl.entre = function(valeur, min, max) {
	return (valeur - min) * (valeur - max) < 0;
};
Utl.aleatoire = function(min, max) {
	return min + Math.random() * (max - min);
};
// Distance entre deux points
Utl.distance = function(p1, p2) {
	return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
Utl.lerp = function(value1, value2, amount) {
	return value1 + (value2 - value1) * amount;
};
// collision Point > Carre
Utl.pointCarre = function(x, y, carre) {
	return Calcul.entre(x, carre.pos.x, carre.pos.x + carre.taille) && Calcul.entre(y, carre.pos.y, carre.pos.y + carre.taille);
};
// Morceler un tableau de plusieurs lignes
Utl.morceler = function(tableau, largeur) {
		var resultat = [];
		for (var i = 0; i < tableau.length; i += largeur) resultat.push(tableau.slice(i, i + largeur))
		return resultat;
};

class Entite {
	constructor(monde, x, y, sprite) {
		this.monde = monde;
		this.limite = monde.limite;
		this.taille = monde.taille;
		this.ctx = monde.ctx;
		this.presse = false;
		this.pos = {
			x: x,
			y: y
		}
		this.vel = {
			x: 0.7,
			y: 0
		}
		this.friction = 0.98;
		this.force = {
			x: 0,
			y: 0.1
		}
		this.hitthefloor = 0;
		this.mort = false;
		this.sprite = new Sprite(this.monde, this, sprite);
		this.sprite.selectLigne = 1;
	}
	integration() { 
		// force
		this.vel.x += this.force.x;
		this.vel.y += this.force.y;
		//friction
		if(this.mort){
		this.vel.x *= this.friction;
		}
		this.vel.y *= this.friction;
		//pos
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		// collision piques 
        let tX = (this.pos.x+this.taille/2) + this.vel.x;
        let tY = (this.pos.y+this.taille/2) + this.vel.y;
        if(this.monde.infoClef(tX, tY).action){
        if (!this.mort && this.monde.infoClef(tX, tY).action === "mort") {
        	this.monde.sons.defaite.url.play();
        	this.mort = true;
        	this.sprite.animation = false;
        	this.sprite.selectLigne += 2;
			this.monde.effets.push(new Effet(this.monde, this.pos.x, this.pos.y, this.monde.ressources.effets,0));
        }else if(this.monde.infoClef(tX, tY).action === "bonus"){
        	this.monde.terrain.geometrie[Math.floor(tY/this.taille)][Math.floor(tX/this.taille)] = 2;
			this.monde.sons.bonus.url.play();		
			this.monde.score +=5;
			this.monde.spawnBonus = true;
        }
        }
		// collision mur
		if (this.pos.x < 32) {
			this.pos.x = 32;
			this.vel.x *= -1;
			if(!this.mort){
			this.monde.sons.bonus.url.play();
			this.monde.score +=1;
			this.monde.piquesGauches();
			this.sprite.selectLigne = 1;

			}
		}
		if (this.pos.x > this.limite.x - 32 - this.taille) {
			this.pos.x = this.limite.x - 32 - this.taille;
			this.vel.x *= -1;
			if(!this.mort){
			this.monde.sons.bonus.url.play();
			this.monde.score +=1;
			this.monde.piquesDroits();
			this.sprite.selectLigne = 0;
		}
		}
		// collision mur et plafond
		if (this.pos.y > this.limite.y - 16 - this.taille) {
			this.vel.y *= -0.8;
			this.pos.y = this.limite.y - 16 - this.taille;
			if(this.hitthefloor<8){
				this.hitthefloor +=1;
			}else{
				this.monde.phase("menu");
			}
		}
		if (this.pos.y < 24) {
			this.vel.y = 0;
			this.pos.y = 24;
		}
		// controles
		if(!this.mort){
		if(this.monde.touches[32] && !this.presse){
			this.monde.sons.saut.url.play();
			this.monde.effets.push(new Effet(this.monde, this.pos.x, this.pos.y, this.monde.ressources.effets,1));
			this.presse = true;
			this.vel.y = -2;
		}
		if(!this.monde.touches[32]){
			this.presse = false;
		}
		}
	}
	dessiner() {
		this.sprite.rendu();
	}
	rendu() {
		this.dessiner();
		this.integration();

	}
}

class Sprite {
	constructor(monde, parent, sprite) {
		this.ctx = monde.ctx;
		this.sprite = sprite;
		this.taille = monde.taille;
		this.l = Math.round(this.sprite.img.width / this.sprite.sep),
			this.h = this.sprite.img.height / this.sprite.ligne
		this.pos = parent.pos;
		this.longueur = this.sprite.sep;
		this.frame = 0;
		this.taille = monde.taille;
		this.selectLigne = 0;
		this.animation = true;
		this.allure = 0.2;
	}
	dessiner() {
		this.ctx.drawImage(this.sprite.img, Math.floor(this.frame) * this.l, this.selectLigne*this.h, this.l, this.h, this.pos.x, this.pos.y, this.l, this.h);
	}
	animer() {
		if (this.animation) {
			this.frame += this.allure;
			if (this.frame >= this.longueur) {
				this.frame = 0;
			}
		}
	}
	rendu() {
		this.animer();
		this.dessiner();
	}
}

class Effet {
	constructor(monde, x, y, sprite,ligne,allure) {
		this.monde = monde;
		this.ctx = monde.ctx;
		this.sprite = sprite;
		this.taille = monde.taille;
		this.l = Math.round(this.sprite.img.width / this.sprite.sep),
		this.h = this.sprite.img.height / this.sprite.ligne
		this.pos = {
			x: x,
			y: y
		};
		this.longueur = this.sprite.sep;
		this.frame = 0;
		this.taille = monde.taille;
		this.selectLigne = ligne ||0;
		this.animation = true;
		this.allure = allure || 0.4;
	}
	rendu() {
		if (this.animation) {
			this.frame += this.allure;
			if (this.frame >= this.longueur) {
				this.monde.effets.splice(this.monde.effets.indexOf(this), 1);
			}
		}
		this.ctx.drawImage(this.sprite.img, Math.floor(this.frame) * this.l, this.selectLigne*this.h, this.l, this.h, this.pos.x - this.l / 4, this.pos.y - this.l / 4, this.l, this.h);
	}
};
/*
   _____                      _     
  / ____|                    (_)    
 | |     ___   ___ _   _ _ __ _ ___ 
 | |    / _ \ / _ \ | | | '__| / __|
 | |___| (_) |  __/ |_| | |_ | \__ \
  \_____\___/ \___|\__,_|_(_)| |___/
                            _/ |    
                           |__/     
*/
class Monde {
	constructor(parametres) {
		// parametres
		this.alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ?!:',.()<>[]";
		this.taille = parametres.taille;
		this.touches = [];
		this.zoom = parametres.zoom || 2;
		this.remplissage = false;
		this.fond = "black";
		this.etat = "menu";
		// niveaux 
		this.meilleurScore = 0;
		this.score = 0;
		this.niveaux = niveaux;
		this.niveauActuel = 0;
		// ressources
		this.prop = {
			compte: 0,
			nombreRessources: parametres.stockImages.length + parametres.stockSon.length
		};
		this.ressources = {};
		// Chargement + lancement
		this.creerContexte();
		if (this.prop !== 0) {
			this.traitement(parametres.stockImages, parametres.stockSon, parametres.clefs);
		};
		// fps
		this.fps = {
			frame: 0,
			nouvelle: 0,
			ancienne: (new Date()).getMilliseconds(),
			conteur: 1,
			rendu: function() {
				this.nouvelle = (new Date()).getMilliseconds();
				if (this.ancienne > this.nouvelle) {
					this.frame = this.conteur;
					this.conteur = 1;
				} else {
					this.conteur += 1;
				}
				this.ancienne = this.nouvelle;
			},
		};
		this.effets = [];
		this.continu = true;
		this.spawnBonus = true;
	}
	creerContexte() {
			this.toile = document.createElement("canvas");
			this.ctx = this.toile.getContext('2d');
			this.L = this.toile.width = 128;
			this.H = this.toile.height = 128;
			this.limite = {
				x: this.L,
				y: this.H
			}
			this.toile.style.width = this.L * this.zoom + "px";
			this.toile.style.height = this.H * this.zoom + "px";
			this.ctx.mozImageSmoothingEnabled = false;
			this.ctx.msImageSmoothingEnabled = false;
			this.ctx.imageSmoothingEnabled = false;
			document.body.appendChild(this.toile);
			console.log('%c Monde créé ', 'padding:2px; border-left:2px solid green; background: lightgreen; color: #000');
			document.addEventListener("keydown", event => this.touchePresse(event), false);
			document.addEventListener("keyup", event => this.toucheLache(event), false);
		}
		/*
		   _____ _                                               _   
		  / ____| |                                             | |  
		 | |    | |__   __ _ _ __ __ _  ___ _ __ ___   ___ _ __ | |_ 
		 | |    | '_ \ / _` | '__/ _` |/ _ \ '_ ` _ \ / _ \ '_ \| __|
		 | |____| | | | (_| | | | (_| |  __/ | | | | |  __/ | | | |_ 
		  \_____|_| |_|\__,_|_|  \__, |\___|_| |_| |_|\___|_| |_|\__|
		                          __/ |                              
		                         |___/                               
		*/
	chargement() {
		this.prop.compte += 1;
		if (this.prop.compte === this.prop.nombreRessources) {
			console.log('%c les images sont chargées ' + this.prop.nombreRessources + " / " + this.prop.nombreRessources, 'padding:2px; border-left:2px solid green; background: lightgreen; color: #000');
			// Fin de chargement
			this.motif = this.ctx.createPattern(this.ressources.motif.img,"repeat");

			this.phase(this.etat);
		} else {
			// écran de chargement
			this.ctx.fillStyle = this.fond;
			this.ctx.fillRect(0, 0, this.L, this.H);
			this.ctx.fillStyle = "#fff";
			this.ctx.fillRect(0, this.H / 2 - 1, (this.prop.compte * this.L) / this.prop.nombreRessources, 1);
		}
	}
	chargerImages(url) {
		let img = new Image();
		img.onload = () =>{
			this.chargement();
		};
		img.src = url;
		return img;
	}
	chargerSon(url) {
		let audio = new Audio(url);
		audio.addEventListener('canplaythrough', this.chargement(), false);
		return audio;
	}
	traitement(stockImages, stockSon, clefs) {
			// traitement images
			let IM = {};
			for (let i = 0; i < stockImages.length; i++) {
				let sujet = stockImages[i];
				let nom = sujet.nom;
				sujet.img = this.chargerImages(stockImages[i].img);
				IM[nom] = stockImages[i];
			}
			this.ressources = IM;
			// traitement Son
			let IS = {};
			for (let i = 0; i < stockSon.length; i++) {
				let sujet = stockSon[i];
				let nom = sujet.nom;
				sujet.url = this.chargerSon(stockSon[i].url);
				sujet.url.volume = 0.1;
				IS[nom] = stockSon[i];
			}
			this.sons = IS;
			if (clefs) {
				//  traitement clefs
				this.nettoyer = new Array(clefs.length).fill(false)
				let CM = {};
				for (let i = 0; i < clefs.length; i++) {
					let sujet = clefs[i];
					let nom = sujet.id;
					if (sujet.type === "sprite") {
						sujet.frame = 0;
						sujet.sprite = this.ressources[sujet.apparence];
						sujet.memoireBoucle = false;
						sujet.peutAnimer = true;
						sujet.boucle = true;
					}
					CM[nom] = clefs[i];
				}
				this.clefs = CM;
			}
		}
		/*
		  ______      __                                 _   
		 |  ____|    /_/                                | |  
		 | |____   _____ _ __   ___ _ __ ___   ___ _ __ | |_ 
		 |  __\ \ / / _ \ '_ \ / _ \ '_ ` _ \ / _ \ '_ \| __|
		 | |___\ V /  __/ | | |  __/ | | | | |  __/ | | | |_ 
		 |______\_/ \___|_| |_|\___|_| |_| |_|\___|_| |_|\__|
		                                                     
		                                                     
		*/
		/*
		handleVisibilityChange(e) {
				if (document.hidden) {
					if (this.enjeu && !this.pause) {
						this.pause = true;
						this.phase("pause");
					}
				}
			}
		*/
	touchePresse(event) {
		this.touches[event.keyCode] = true;
		if (this.touches[70]) {
			this.activeRemplissage();
		}
		switch (this.etat) {
			case "menu":
				if (this.touches[32]) {
					this.phase("start")
				}
				break;
				console.log("aucune touche reconnue");
		}
	}
	toucheLache(event) {
		this.touches[event.keyCode] = false;
	}
	activeRemplissage() {
			if (!this.remplissage) {
				this.toile.webkitRequestFullScreen()
				this.remplissage = true;
				this.toile.style.width = "100vmin";
				this.toile.style.height = "100vmin";
			} else {
				document.webkitCancelFullScreen()
				this.remplissage = false;
				this.toile.style.width = this.L * this.zoom + "px";
				this.toile.style.height = this.H * this.zoom + "px";
			}
		}
		/*
		  ______               _   _                 
		 |  ____|             | | (_)                
		 | |__ ___  _ __   ___| |_ _  ___  _ __  ___ 
		 |  __/ _ \| '_ \ / __| __| |/ _ \| '_ \/ __|
		 | | | (_) | | | | (__| |_| | (_) | | | \__ \
		 |_|  \___/|_| |_|\___|\__|_|\___/|_| |_|___/
		                                             
		*/
	chercheClef(recherche) {
		let blockRecherche = [];
		for (var j = 0; j < this.terrain.dimension.y; j++) {
			for (var i = 0; i < this.terrain.dimension.x; i++) {
				let id = this.terrain.geometrie[j][i];
				if (this.clefs[id].nom === recherche) {
					let info = {
						pos: {
							x: i,
							y: j
						}
					}
					blockRecherche.push(info);
				}
			}
		}
		return blockRecherche;
	}
	infoClef(x, y) {
		let newX = Math.floor(x/this.taille);
		let newY = Math.floor(y/this.taille);
		if (newX > -1 && newX < this.terrain.dimension.x && newY > -1 && newY < this.terrain.dimension.y) {
			return this.clefs[this.terrain.geometrie[newY][newX]];
		} else {
			return false;
		}
	}
	ecrire(texte, x, y, couleur) {
		let largeur = 6,
			hauteur = 9;
		let mult = couleur || 0;
		let centre = (texte.length * largeur) / 2;
		for (let i = 0; i < texte.length; i++) {
			let index = this.alphabet.indexOf(texte.charAt(i)),
				clipX = largeur * index,
				posX = (x - centre) + (i * largeur);
			this.ctx.drawImage(this.ressources.pixelFont.img, clipX, (mult * hauteur), largeur, hauteur, posX, y, largeur, hauteur);
		}
	}
	boite(x, y, l, h) {
		this.ctx.fillStyle = "white";
		// dessiner le fond
		this.ctx.fillRect(x + 1, y + 1, l - 2, h - 2);
		// dessiner les bords
		//haut Gauche
		this.ctx.drawImage(this.ressources.curseur.img, 32, 16, 16, 16, x, y, 16, 16);
		//haut Droit
		this.ctx.drawImage(this.ressources.curseur.img, 32 + 8, 16, 16, 16, x + l - 16, y, 16, 16);
		//bas Gauche
		this.ctx.drawImage(this.ressources.curseur.img, 32, 16 + 8, 16, 16, x, y + h - 16, 16, 16);
		//bas Gauche
		this.ctx.drawImage(this.ressources.curseur.img, 32 + 8, 16 + 8, 16, 16, x + l - 16, y + h - 16, 16, 16);
		// haut
		this.ctx.drawImage(this.ressources.curseur.img, 32 + 4, 16, 16, 16, x + 16, y, l - 32, 16);
		// bas
		this.ctx.drawImage(this.ressources.curseur.img, 32 + 4, 16 + 8, 16, 16, x + 16, y + h - 16, l - 32, 16);
		// gauche
		this.ctx.drawImage(this.ressources.curseur.img, 32, 16 + 4, 16, 16, x, y + 16, 16, h - 32);
		// droit
		this.ctx.drawImage(this.ressources.curseur.img, 32 + 8, 16 + 4, 16, 16, x + l - 16, y + 16, 16, h - 32);
	}
	bitMasking() {
		let tuileBitMask = [];
		let compte = 0;
		this.terrain.apparence = [];
		for (var j = 0; j < this.terrain.dimension.y; j++) {
			for (var i = 0; i < this.terrain.dimension.x; i++) {
				let id = this.terrain.geometrie[j][i];
				// haut gauche droit bas
				let voisine = [0, 0, 0, 0];
				compte += 1;
				if (j - 1 > -1) {
					if ( 0 !== this.terrain.geometrie[j - 1][i]) {
						//haut
						voisine[0] = 1;
					}
				} else {
					voisine[0] = 1;
				}
				if (i - 1 > -1) {
					if ( 0 !== this.terrain.geometrie[j][i - 1]) {
						// gauche
						voisine[1] = 1;
					}
				} else {
					voisine[1] = 1;
				}
				if (i + 1 < this.terrain.dimension.x) {
					if ( 0 !== this.terrain.geometrie[j][i + 1]) {
						// droite
						voisine[2] = 1;
					}
				} else {
					voisine[2] = 1;
				}
				if (j + 1 < this.terrain.dimension.y) {
					if ( 0 !== this.terrain.geometrie[j + 1][i]) {
						//bas
						voisine[3] = 1;
					}
				} else {
					voisine[3] = 1;
				}
				id = 1 * voisine[0] + 2 * voisine[1] + 4 * voisine[2] + 8 * voisine[3];
				this.terrain.apparence.push(id);
			}
		}
		this.terrain.apparence = Utl.morceler(this.terrain.apparence, this.terrain.dimension.x);
	}
	renduTerrain() {
		for (let j = 0; j < this.terrain.dimension.y; j++) {
			for (let i = 0; i < this.terrain.dimension.x; i++) {
				let id = this.terrain.geometrie[j][i];
				if (this.clefs[id].apparence === "auto") {
					var sourceX = Math.floor(this.terrain.apparence[j][i]) * this.taille;
					var sourceY = Math.floor(this.terrain.apparence[j][i]) * this.taille;
					this.ctx.drawImage(this.ressources.feuille.img, sourceX, this.clefs[id].ligne * this.taille, this.taille, this.taille, i * this.taille, j * this.taille, this.taille, this.taille);
				} else if (this.clefs[id].type === "sprite") {
					if (!this.clefs[id].memoireBoucle) {
						if (this.clefs[id].peutAnimer) {
							this.clefs[id].frame += this.clefs[id].allure;
						}
						if (this.clefs[id].frame >= this.clefs[id].sprite.sep) {
							if (!this.clefs[id].boucle) {
								this.clefs[id].peutAnimer = false;
							}
							this.clefs[id].frame = 0;
						}
						this.clefs[id].memoireBoucle = true;
						// on sait quel id est déjà passé :^)
						this.nettoyer[id] = true;
					}
					this.ctx.drawImage(this.clefs[id].sprite.img, Math.floor(this.clefs[id].frame) * this.taille, 0, this.taille, this.taille, i * this.taille, j * this.taille, this.taille, this.taille);
				} else {
					var sourceX = Math.floor(this.clefs[id].apparence % 16) * this.taille;
					var sourceY = Math.floor(this.clefs[id].apparence / 16) * this.taille;
					this.ctx.drawImage(this.ressources.feuille.img, sourceX, sourceY, this.taille, this.taille, i * this.taille, j * this.taille, this.taille, this.taille);
				}
			}
		}
		for (var i = 0; i < this.nettoyer.length; i++) {
			if (this.nettoyer[i]) {
				this.clefs[i].memoireBoucle = false;
			}
		}
	}
	initialiserMap() {
			this.terrain = {};
			this.terrain.geometrie = this.niveaux[this.niveauActuel].geometrie;
			this.terrain.dimension = {
				x: this.terrain.geometrie[0].length,
				y: this.terrain.geometrie.length
			};
			this.terrain.apparence = [];
			this.bitMasking();
		}
		/*
		  ______           _            
		 |  ____|         (_)           
		 | |__   _ __      _  ___ _   _ 
		 |  __| | '_ \    | |/ _ \ | | |
		 | |____| | | |   | |  __/ |_| |
		 |______|_| |_|   | |\___|\__,_|
		                 _/ |           
		                |__/            
		*/
	piquesAleatoire() {
		// position y aleatoire pour 4 piques
		let tirage = [];
		while (tirage.length < 4) {
			let nombreAleatoire = Math.round(Utl.aleatoire(4, 12));
			if (tirage.indexOf(nombreAleatoire) === -1) {
				tirage.push(nombreAleatoire);
			}
		}
		return tirage;
	}
	piquesGauches() {
		// on nettoie la rangée gauche
		for (var i = 0; i < 9; i++) {
			this.terrain.geometrie[4+i][4] = 2;
		}
		// on donne des piques aleatoires sur la rangée droite
		let distribuer = this.piquesAleatoire();
		for (var i = 0; i < distribuer.length; i++) {
			this.terrain.geometrie[distribuer[i]][11] = 6;
		}
		// on ajoute un bonus s'il n'y en a pas
		if(this.spawnBonus){
			this.spawnBonus = false;
			let posBonus = Math.round(Utl.aleatoire(4, 12));
			this.effets.push(new Effet(this, (10*this.taille)+2, posBonus*this.taille, this.ressources.effets,0));
			this.terrain.geometrie[posBonus][10] = 7;
		}
	}
	piquesDroits() {
		// on nettoie la rangée droite
		for (var i = 0; i < 9; i++) {
			this.terrain.geometrie[4+i][11] = 2;
		}
		// on donne des piques aleatoires sur la rangée droite
		let distribuer = this.piquesAleatoire();
		for (var i = 0; i < distribuer.length; i++) {
			this.terrain.geometrie[distribuer[i]][4] = 5;
		}
		if(this.spawnBonus){
			this.spawnBonus = false;
			let posBonus = Math.round(Utl.aleatoire(4, 12));
			this.effets.push(new Effet(this, (5*this.taille)+2, posBonus*this.taille, this.ressources.effets,0));
			this.terrain.geometrie[posBonus][5] = 7;
		}
	}
	nettoyerPiques(){
		for (var i = 0; i < 9; i++) {
			this.terrain.geometrie[4+i][4] = 2;
		}
		for (var i = 0; i < 9; i++) {
			this.terrain.geometrie[4+i][11] = 2;
		}
		for (var i = 0; i < 9; i++) {
			this.terrain.geometrie[4+i][10] = 2;
		}
		for (var i = 0; i < 9; i++) {
			this.terrain.geometrie[4+i][5] = 2;
		}

	}
	initialiser() {
		this.initialiserMap();
		this.spawnBonus = true;
		this.score = 0;
		this.continu = true;
		this.oiseau = new Entite(this, this.L / 2, this.H / 2, this.ressources.oiseau);
		this.boucle();
	}
	rendu() {
		this.ctx.fillStyle = this.motif;
		this.ctx.fillRect(32, 24, 64, 88);

		this.renduTerrain();
		this.ecrire(this.score.toString(), this.L / 2, 4);
		this.oiseau.rendu();
		for (var i = this.effets.length - 1; i >= 0; i--) {
			this.effets[i].rendu();
		}
	}
	boucle() {
		this.ctx.fillStyle = this.fond;
		this.ctx.fillRect(0, 0, this.L, this.H);
		this.rendu();
		if(this.continu){
		this.animation = requestAnimationFrame(() => this.boucle());
		}
	}
	phase(phase) {
		this.etat = phase;
		this.continu = false;
		cancelAnimationFrame(this.animation);
		this.ctx.fillStyle = this.fond;
		this.ctx.fillRect(0, 0, this.L, this.H);
		switch (phase) {
			case "menu":
			if(this.score > this.meilleurScore){
				this.meilleurScore = this.score;
			}
			this.initialiserMap();
			this.nettoyerPiques();
			this.ctx.fillStyle = this.motif;
			this.ctx.fillRect(32, 24, 64, 88);
			this.renduTerrain();
			this.ctx.fillStyle="black";
			this.ctx.globalAlpha = 0.8;
			this.ctx.fillRect(0,0,this.L,this.H);
			this.ctx.globalAlpha = 1;
			this.ecrire("Best Score : " + this.meilleurScore, this.L / 2, 4);
			this.ecrire("[spacebar] to jump", this.L / 2, this.H/2);
				break;
			case "start":
				this.initialiser();
				break;
			default:
				console.log("aucune action reconnue");
		}
	}
}


    let parametres = {
       taille:8,
       zoom:4,
       
      stockSon:[
       {url:"http://www.noiseforfun.com/waves/interface-and-media/NFF-select-04.wav",nom:"saut"},
       {url:"http://www.noiseforfun.com/waves/interface-and-media/NFF-menu-04-b.wav",nom:"bonus"},
       {url:"http://www.noiseforfun.com/waves/interface-and-media/NFF-lose.wav",nom:"defaite"},
        ],

       stockImages: [
       {img:"https://image.ibb.co/by5TQQ/font.png",nom:"pixelFont"},
       {img:"https://image.ibb.co/kiYF5Q/oiseau.png",nom:"oiseau",sep:6,ligne:4,allure:0.6},
       {img:"https://image.ibb.co/mvORC5/effets.png",nom:"effets",sep:7,ligne:3,allure:0.6},
       {img:"https://image.ibb.co/hCPoQQ/feuille.png",nom:"feuille"},
       {img:"https://image.ibb.co/dojBek/piece.png",nom:"piece",sep:6},
       {img:"https://image.ibb.co/gU7a5Q/motif.png",nom:"motif"},
           ],

       clefs:[
       {type:"tuile",nom:"vide",id:0,collision:true},
       {type:"tuile",nom:"mur",id:1,collision:false,apparence:"auto",ligne:1},
       {type:"tuile",nom:"fond",id:2,collision:false,apparence:0},
       {type:"tuile",nom:"piqueHaut",id:3,collision:false,apparence:2,action:"mort"},
       {type:"tuile",nom:"piqueBas",id:4,collision:false,apparence:3,action:"mort"},
       {type:"tuile",nom:"piqueGauche",id:5,collision:false,apparence:4,action:"mort"},
       {type:"tuile",nom:"piqueDroit",id:6,collision:false,apparence:5,action:"mort"},
       {type:"sprite",nom:"suivant",id:7,collision:false,action:"bonus",apparence:"piece",ligne:1,allure:0.2},
       ],
    }

let niveaux = [
{
nom:"lvl1",
geometrie:[
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
[0,0,0,1,3,3,3,3,3,3,3,3,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
[0,0,0,1,4,4,4,4,4,4,4,4,1,0,0,0],
[0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
},
];


		let demo = new Monde(parametres,niveaux);

