# XR FUSION MATH LAB

Aplicación web educativa que muestra cómo una figura 2D se convierte en un sólido 3D:

| Figura 2D | Transformación | Sólido |
|---|---|---|
| Círculo | Extrusión | Cilindro |
| Triángulo rectángulo | Revolución (eje: un cateto) | Cono |
| Parábola (región acotada) | Revolución (eje de la parábola) | Paraboloide |

## Estructura
```
xr-fusion-math-lab/
├── index.html
├── css/style.css
├── js/app.js
└── README.md
```

## Ejecutar en XAMPP
1. Copia la carpeta `xr-fusion-math-lab` dentro de `C:\xampp\htdocs\`.
2. Inicia Apache en el panel de XAMPP.
3. Abre `http://localhost/xr-fusion-math-lab/` en Chrome o Edge.

No funciona abriendo `index.html` con doble clic (`file://`): los módulos y la cámara requieren `http://localhost` o `https`.
Para GitHub Pages, sube la carpeta a un repositorio y activa Pages (ya usa https).

Requiere internet: Three.js, MediaPipe y las fuentes se cargan desde CDN (jsDelivr, Google). Para uso sin conexión, descarga esos archivos y cambia las rutas.

## Uso
- Elige una figura en el catálogo, pulsa **Animar** o mueve el control **Avance**.
- Cambia **radio** y **altura**: volumen y área se actualizan en tiempo real.
- Mouse: arrastra para rotar, rueda para zoom.
- **Activar cámara y gestos** y concede el permiso de cámara.

## Gestos (MediaPipe Hand Landmarker)
| Gesto | Acción |
|---|---|
| Palma abierta en movimiento | Rotar el sólido |
| Índice levantado | Mover el cursor; mantenerlo ~1 s sobre un botón lo pulsa |
| Pinza pulgar + índice | Mover la mano a los lados controla el avance |
| Dos manos | Separar/juntar para zoom |
| Puño | Restablecer vista |

Aclaración: MediaPipe solo reconoce los gestos. El cálculo geométrico y el renderizado 3D los hace la aplicación (JavaScript + Three.js).
La superposición sobre cámara es una demostración educativa, no una RA con anclaje espacial completo.

## Fórmulas
- Cilindro: V = πr²h · A = 2πr(r+h)
- Cono: V = ⅓πr²h · A = πr(r+g), g = √(r²+h²)
- Paraboloide (acotado en y = h): V = ½πr²h · A_lat = πr/(6h²)·[(r²+4h²)^(3/2) − r³], más la tapa πr²
