# Reglas sin historia

Reglas que el sistema **ya aplica** y que ninguna historia recoge todavía. Hoy viven en código, en
documentos de arquitectura o en tablas de flujos, **donde nadie las comprueba**: el guardián solo
mira criterios de aceptación.

**No es un backlog ni una lista de defectos.** Es la lista de trabajo para escribir historias,
ordenada por el daño que hace no tenerlas, y existe para que esa deuda sea contable en vez de
disolverse.

**Cómo se usa.** Cuando se vaya a tocar un área, se escriben primero sus reglas como criterios y se
borran de aquí. No se escriben todas de golpe: producto tiene que validarlas.

*Detectadas el {{FECHA}} con: {{CÓMO SE DETECTARON — p. ej. «barrido de docs/arquitectura/ con la
prueba de la frontera»}}.*

## Primero, por gravedad

| Regla | Dónde vive hoy | Por qué urge |
|---|---|---|
| **{{Regla en prosa, en negrita}}** | `ruta/al/archivo` o documento | {{qué pasa si alguien la rompe sin saberlo}} |

## {{AREA}}

| Regla | Dónde vive hoy |
|---|---|
| **{{Regla}}** | `ruta/al/archivo` |

<!-- Cuando una regla se convierte en criterio, se borra de la tabla y se deja una nota:
     *(… ya no están aquí: son [AC-001-03](EJEMPLO/historia-ejemplo.md) y …)* -->
