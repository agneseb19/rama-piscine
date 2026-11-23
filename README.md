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
| `video/video-1.mp4` | Tutto il cantiere, dal prato alla piscina piena (Kling 4.0, 20 s, 1080p), guidato dallo scroll. I secondi di ogni fase sono in `VIDEO_KEYS` in `main.js` |
| `img/` | Foto originali dei lavori e loghi di marchi e partner |
| `img/hd/` | Foto migliorate e raddrizzate usate nella pagina |

## Da completare prima della pubblicazione

- Valutazione media e numero di recensioni Google (segnaposto in `index.html`, cerca "DA AGGIORNARE").
- Le pagine interne: `chi-siamo.html`, `servizi.html`, `le-nostre-piscine.html`, `contatti.html`, `configuratore.html`.
- Il form di consulenza oggi apre l'app di posta: va collegato a un servizio di invio moduli.

## Hero sul telefono: versioni verticali

Sul telefono in verticale la hero usa le 6 fasi verticali in `fasi-mobile/01.jpg` … `06.jpg` (stessa scena e stessa inquadratura fissa per tutte). Sul telefono non c'è video: il passaggio prato → scavo usa la stessa transizione delle altre fasi.

Finché manca anche solo una delle 6 foto, il telefono usa le foto orizzontali (fascia panoramica). Se la piscina nelle foto verticali è più in alto o più in basso, si regola `mobileFocus` in `main.js`.
