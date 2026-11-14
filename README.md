# Ra.Ma. Piscine — nuovo sito

Nuova homepage di [ramapiscine.com](https://ramapiscine.com): costruzione, installazione e manutenzione di piscine su misura nel Lazio (showroom a Valmontone, RM).

## Come vederlo in locale

Il sito usa moduli JavaScript e un video, quindi va aperto da un piccolo server locale (non con doppio clic sul file):

```bash
python3 -m http.server 8000
```

poi apri <http://localhost:8000>.

## Struttura

| File / cartella | Contenuto |
| --- | --- |
| `index.html` | La homepage |
| `style.css`, `main.js` | La hero: il cantiere che diventa piscina scorrendo (three.js + Lenis) |
| `home.css`, `home.js` | Tutto ciò che viene dopo la hero (GSAP + ScrollTrigger) |
| `fasi/` | Le 6 immagini delle fasi della hero |
| `video/video-1.mp4` | Il passaggio prato → scavo, guidato dallo scroll |
| `img/` | Foto originali dei lavori e loghi di marchi e partner |
| `img/hd/` | Foto migliorate e raddrizzate usate nella pagina |

## Da completare prima della pubblicazione

- Valutazione media e numero di recensioni Google (segnaposto in `index.html`, cerca "DA AGGIORNARE").
- Le pagine interne: `chi-siamo.html`, `servizi.html`, `le-nostre-piscine.html`, `contatti.html`, `configuratore.html`.
- Il form di consulenza oggi apre l'app di posta: va collegato a un servizio di invio moduli.
- Video della hero: esportarlo in 1080p o più, senza filigrana.

## Hero sul telefono: versioni verticali

Sul telefono in verticale la hero usa, se ci sono, le versioni verticali della scena:

| File | Contenuto |
| --- | --- |
| `fasi-mobile/01.jpg` … `fasi-mobile/06.jpg` | Le 6 fasi in verticale, 1080×1920, stessa scena e stessa inquadratura fissa per tutte |
| `video/video-1-mobile.mp4` | Il passaggio prato → scavo in verticale, 1080×1920, dalla fase 01 alla fase 02 |

Se mancano, il telefono usa le foto orizzontali (fascia panoramica). Se la piscina nelle foto verticali è più in alto o più in basso, si regola `mobileFocus` in `main.js`.
