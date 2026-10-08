# Simulador de Cinemática RRR

Simulador web interactivo de un brazo robótico articulado de 3 grados de libertad (configuración RRR), desarrollado con HTML5 Canvas, CSS3 y JavaScript nativo. El sistema permite modelar la cinemática directa e inversa, así como registrar trayectorias autónomas mediante un Teach Pendant virtual.

## Características Principales

- **Cinemática Directa (IK):** Control articular mediante deslizadores o cálculo analítico en tiempo real haciendo clic directamente sobre el lienzo de trabajo.
- **Grabador de Trayectorias (Teach Pendant):** Almacenamiento de múltiples poses (waypoints) y reproducción autónoma mediante interpolación suave con curvas.
- **Suavizado de Movimiento (LERP):** Implementación de inercia y transiciones fluidas entre configuraciones mecánicas.
- **Telemetría y Cinemática:** Visualización dinámica de las coordenadas del efector final, orientación y la Matriz Homogénea $T_0^3$.
- **Interfaz Moderna:** Diseño adaptable con modo oscuro/claro y alertas de límites articulares.

## Tecnologías Utilizadas

- **HTML5 Canvas:** Renderizado gráfico 2D del robot, eslabones, juntas, estelas y espacio de trabajo.
- **CSS3:** Estilos personalizados con variables CSS y diseño responsivo.
- **JavaScript (ES6+):** Lógica matemática para trigonometría, matrices homogéneas, cinemática y bucle de animación (`requestAnimationFrame`).

## Estructura del Proyecto

```text
├── index.html       # Estructura principal de la interfaz web
├── style.css        # Estilos, diseño responsivo y temas (claro/oscuro)
└── script.js        # Lógica del simulador, cinemática y bucle gráfico
