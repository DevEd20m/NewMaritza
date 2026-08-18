-- Public quiz definition snapshot only; no profiles, answers or customer data.
-- Production already contains these IDs, so this migration is a no-op there.

insert into public.quiz_templates
select * from jsonb_populate_recordset(null::public.quiz_templates, $quiz$
[
  {
    "id": "55550001-0000-0000-0000-000000000001",
    "kit_id": null,
    "name": "Cuestionario LIORA",
    "description": "Descubre tu kit de bienestar personalizado",
    "max_questions": 9,
    "created_at": "2026-05-27T19:36:07.683861+00:00"
  }
]
$quiz$::jsonb)
on conflict (id) do nothing;

insert into public.quiz_question_groups
select * from jsonb_populate_recordset(null::public.quiz_question_groups, $quiz$
[
  {
    "id": "55550011-0001-0000-0000-000000000001",
    "template_id": "55550001-0000-0000-0000-000000000001",
    "title": "¿Qué buscas?",
    "sort_order": 1,
    "interstitial_text": null
  },
  {
    "id": "55550011-0002-0000-0000-000000000001",
    "template_id": "55550001-0000-0000-0000-000000000001",
    "title": "Cuéntanos más",
    "sort_order": 2,
    "interstitial_text": null
  },
  {
    "id": "55550011-0003-0000-0000-000000000001",
    "template_id": "55550001-0000-0000-0000-000000000001",
    "title": "Para terminar",
    "sort_order": 3,
    "interstitial_text": "Ya casi. Solo unas últimas preguntas."
  }
]
$quiz$::jsonb)
on conflict (id) do nothing;

insert into public.quiz_questions
select * from jsonb_populate_recordset(null::public.quiz_questions, $quiz$
[
  {
    "id": "55550012-0001-0001-0000-000000000001",
    "group_id": "55550011-0001-0000-0000-000000000001",
    "text": "¿Qué quieres cuidar hoy?",
    "subtext": "Elige la opción que más se parece a lo que necesitas ahora.",
    "type": "single",
    "sort_order": 1,
    "is_required": true,
    "conditions": null
  },
  {
    "id": "55550012-0002-0001-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué tipo de entrenamiento haces?",
    "subtext": null,
    "type": "single",
    "sort_order": 1,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-rendimiento"
      ]
    }
  },
  {
    "id": "55550012-0002-0002-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cuál es tu nivel de entrenamiento?",
    "subtext": null,
    "type": "single",
    "sort_order": 2,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-rendimiento"
      ]
    }
  },
  {
    "id": "55550012-0002-0003-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Sientes molestias en articulaciones o rodillas?",
    "subtext": null,
    "type": "single",
    "sort_order": 3,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-rendimiento"
      ]
    }
  },
  {
    "id": "55550012-0002-0004-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿En qué quieres enfocarte?",
    "subtext": null,
    "type": "single",
    "sort_order": 4,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-belleza"
      ]
    }
  },
  {
    "id": "55550012-0002-0005-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cuál es tu tipo de piel?",
    "subtext": null,
    "type": "single",
    "sort_order": 5,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "foco-piel"
      ]
    }
  },
  {
    "id": "55550012-0002-0006-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué te preocupa más de tu piel?",
    "subtext": "Puedes elegir varias.",
    "type": "multi",
    "sort_order": 6,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "foco-piel",
        "foco-antiedad"
      ]
    }
  },
  {
    "id": "55550012-0002-0007-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cuál es tu problema capilar principal?",
    "subtext": "Puedes elegir varios.",
    "type": "multi",
    "sort_order": 7,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "foco-cabello"
      ]
    }
  },
  {
    "id": "55550012-0002-0008-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué es lo que más te afecta en tu día a día?",
    "subtext": null,
    "type": "single",
    "sort_order": 8,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-bienestar"
      ]
    }
  },
  {
    "id": "55550012-0002-0009-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Con qué frecuencia lo sientes?",
    "subtext": null,
    "type": "single",
    "sort_order": 9,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "foco-sueno",
        "foco-estres",
        "foco-sueno-estres"
      ]
    }
  },
  {
    "id": "55550012-0002-0010-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cuál es tu síntoma principal?",
    "subtext": "Puedes elegir varios.",
    "type": "multi",
    "sort_order": 10,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-digestivo"
      ]
    }
  },
  {
    "id": "55550012-0002-0011-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cuál es tu prioridad?",
    "subtext": "Puedes elegir varias.",
    "type": "multi",
    "sort_order": 11,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-nutricion"
      ]
    }
  },
  {
    "id": "55550012-0002-0012-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué tan importante es que sean productos naturales u orgánicos?",
    "subtext": null,
    "type": "single",
    "sort_order": 12,
    "is_required": true,
    "conditions": null
  },
  {
    "id": "55550012-0002-0013-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cómo es tu exposición al sol normalmente?",
    "subtext": null,
    "type": "single",
    "sort_order": 13,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-solar"
      ]
    }
  },
  {
    "id": "55550012-0002-0014-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué tipo de destino es tu viaje?",
    "subtext": null,
    "type": "single",
    "sort_order": 14,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-viaje"
      ]
    }
  },
  {
    "id": "55550012-0002-0015-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué tipo de kit buscas para casa?",
    "subtext": null,
    "type": "single",
    "sort_order": 15,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-hogar"
      ]
    }
  },
  {
    "id": "55550012-0002-0016-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué te preocupa principalmente?",
    "subtext": null,
    "type": "single",
    "sort_order": 16,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-pies-cuerpo"
      ]
    }
  },
  {
    "id": "55550012-0002-0017-0000-000000000001",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Qué buscas principalmente con tu entrenamiento?",
    "subtext": null,
    "type": "single",
    "sort_order": 4,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-rendimiento"
      ]
    }
  },
  {
    "id": "55550012-0003-0001-0000-000000000001",
    "group_id": "55550011-0003-0000-0000-000000000001",
    "text": "¿Tienes alguna restricción o preferencia?",
    "subtext": null,
    "type": "multi",
    "sort_order": 1,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "retirada-fusionada-en-seguridad"
      ]
    }
  },
  {
    "id": "55550012-0003-0002-0000-000000000001",
    "group_id": "55550011-0003-0000-0000-000000000001",
    "text": "¿Tienes piel o cuero cabelludo sensible?",
    "subtext": null,
    "type": "single",
    "sort_order": 2,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-belleza"
      ]
    }
  },
  {
    "id": "55550012-0003-0004-0000-000000000001",
    "group_id": "55550011-0003-0000-0000-000000000001",
    "text": "¿Cómo quieres armar tu kit?",
    "subtext": "Nos adaptamos a ti: elige el nivel de tu ritual.",
    "type": "single",
    "sort_order": 4,
    "is_required": true,
    "conditions": null
  },
  {
    "id": "55550012-0003-0005-0000-000000000001",
    "group_id": "55550011-0003-0000-0000-000000000001",
    "text": "Antes de recomendarte, ¿hay algo que debamos saber?",
    "subtext": "Marca todo lo que aplique — tu seguridad es lo primero.",
    "type": "multi",
    "sort_order": 0,
    "is_required": true,
    "conditions": null
  },
  {
    "id": "55550012-0003-0006-0000-000000000001",
    "group_id": "55550011-0003-0000-0000-000000000001",
    "text": "¿Qué tipo de rutina prefieres?",
    "subtext": null,
    "type": "single",
    "sort_order": 3,
    "is_required": true,
    "conditions": null
  },
  {
    "id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "group_id": "55550011-0002-0000-0000-000000000001",
    "text": "¿Cuál de estas se parece más a lo que necesitas?",
    "subtext": "Elige la frase que más resuene contigo ahora.",
    "type": "single",
    "sort_order": 18,
    "is_required": true,
    "conditions": {
      "if_any_slug": [
        "obj-guia"
      ]
    }
  }
]
$quiz$::jsonb)
on conflict (id) do nothing;

insert into public.quiz_question_options
select * from jsonb_populate_recordset(null::public.quiz_question_options, $quiz$
[
  {
    "id": "009d728c-c277-4ece-91c2-aed458b3891d",
    "question_id": "55550012-0002-0007-0000-000000000001",
    "text": "Frizz y falta de brillo",
    "slug": "cabello-frizz",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "015a39da-eba6-4b05-9cc9-3d2da721dc14",
    "question_id": "55550012-0002-0017-0000-000000000001",
    "text": "Cuidar mis articulaciones",
    "slug": "gym-articulaciones",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "0334b8dd-54bf-4901-9464-e1a250b35dbd",
    "question_id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "text": "Tengo molestias digestivas o quiero vitaminas",
    "slug": "guia-digestivo",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "047ed1c2-3089-4ef5-a3cd-03b1124016e6",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Ninguna restricción",
    "slug": "sin-restriccion",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "07ca931c-dcd8-4a5e-b7fa-7297998b1ece",
    "question_id": "55550012-0002-0001-0000-000000000001",
    "text": "Yoga, pilates o movilidad",
    "slug": "tipo-yoga",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0001-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "09ff0d01-7ab6-42a4-a058-952014810605",
    "question_id": "55550012-0002-0013-0000-000000000001",
    "text": "Montaña, running o deporte outdoor intenso",
    "slug": "solar-outdoor",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "0ae4573e-b4e5-4e56-89f8-709337b47058",
    "question_id": "55550012-0002-0010-0000-000000000001",
    "text": "Hinchazón y gases después de comer",
    "slug": "digestivo-hinchazon",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0011-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "0edae17c-0be1-476a-903e-bee84bbec309",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Gym y rendimiento",
    "slug": "obj-rendimiento",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "10c1f813-e200-4d1e-b6e9-adfc4b1e99ad",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Mi digestión o hidratación",
    "slug": "obj-digestivo",
    "icon_url": null,
    "sort_order": 5,
    "tag_ids": [
      "aaaa0011-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "188bb127-47f8-429f-ac35-b086c94a3a8c",
    "question_id": "55550012-0003-0002-0000-000000000001",
    "text": "Sí, reacciono a algunos ingredientes",
    "slug": "alerg-piel",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0020-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "1895ffda-24be-4f47-ad4e-4aab24740066",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Intolerante a la lactosa",
    "slug": "alerg-lactosa",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "1d691c81-b0a5-4def-a614-bd94fe1816a0",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Ninguna",
    "slug": "sin-condicion",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "2ca5d1b1-c6eb-4270-874f-f3cbcb04e03a",
    "question_id": "55550012-0003-0006-0000-000000000001",
    "text": "Completa, quiero más opciones",
    "slug": "rutina-completa",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "2e0fd579-929c-4d8b-8f59-c2b4b9c15d8c",
    "question_id": "55550012-0002-0015-0000-000000000001",
    "text": "Kit compacto para el día a día",
    "slug": "hogar-compacto",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "2e6ffaed-6837-4381-8aa9-cfb4f2a6a9e1",
    "question_id": "55550012-0002-0014-0000-000000000001",
    "text": "Montaña, senderismo o aventura",
    "slug": "viaje-aventura",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "2ea50835-b42d-4b0c-8657-f7a1e90550ed",
    "question_id": "55550012-0002-0006-0000-000000000001",
    "text": "Poros grandes o exceso de grasa",
    "slug": "piel-poros",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0017-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "301da97e-4522-4b0e-9158-3a443e226c18",
    "question_id": "55550012-0002-0001-0000-000000000001",
    "text": "HIIT o entrenamiento funcional",
    "slug": "tipo-hiit",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0002-0000-0000-0000-000000000000",
      "aaaa0013-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "302dc56f-ea26-41cf-98eb-7266524fa127",
    "question_id": "55550012-0002-0011-0000-000000000001",
    "text": "Más energía y vitalidad durante el día",
    "slug": "nutricion-energia",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0001-0000-0000-0000-000000000000",
      "aaaa0008-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "31f3751d-d1d1-470a-934d-ea55637b5298",
    "question_id": "55550012-0002-0005-0000-000000000001",
    "text": "Normal, quiero mantenerla así",
    "slug": "piel-normal",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "384e040a-80b7-4022-bf22-642d98b5eb69",
    "question_id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "text": "Me voy de viaje o quiero protección solar",
    "slug": "guia-viaje",
    "icon_url": null,
    "sort_order": 5,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "389ae5de-6b59-481c-bbcc-437b7cae6ea5",
    "question_id": "55550012-0002-0011-0000-000000000001",
    "text": "Vitaminas de base: omega, vitamina D, complejo B",
    "slug": "nutricion-base",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0005-0000-0000-0000-000000000000",
      "aaaa0001-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "3c6e3420-0df3-48a9-a2c1-25b8142a50af",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "No estoy seguro/a, quiero que LIORA me guíe",
    "slug": "obj-guia",
    "icon_url": null,
    "sort_order": 10,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "3cdf45fe-be36-49cc-8fad-a5f8168e9164",
    "question_id": "55550012-0002-0004-0000-000000000001",
    "text": "Antiedad integral: piel firme y cuerpo fuerte con los años",
    "slug": "foco-antiedad",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0006-0000-0000-0000-000000000000",
      "aaaa0010-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "3d125694-8bc2-4dca-94fc-743fb9c5f62c",
    "question_id": "55550012-0002-0008-0000-000000000001",
    "text": "Me cuesta relajarme o siento mucha carga mental",
    "slug": "foco-estres",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0012-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "3e5f55af-0dac-4986-8f6c-90e38be8f61c",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Sin fragancia",
    "slug": "pref-sin-fragancia",
    "icon_url": null,
    "sort_order": 8,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "3f118e5e-f018-4922-b3a7-760f66833ba0",
    "question_id": "55550012-0002-0007-0000-000000000001",
    "text": "Sequedad, quiebre o puntas abiertas",
    "slug": "cabello-sequedad",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "3f6834ca-b751-4edc-b6a7-2bb77d7107e1",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Viaje, playa u outdoor",
    "slug": "obj-viaje",
    "icon_url": null,
    "sort_order": 6,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "4085c600-87f1-4359-ad72-89083df2f851",
    "question_id": "55550012-0002-0017-0000-000000000001",
    "text": "Hidratarme mejor",
    "slug": "gym-hidratacion",
    "icon_url": null,
    "sort_order": 5,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "4b67e89c-5332-42a6-a299-06d7de5e0655",
    "question_id": "55550012-0002-0016-0000-000000000001",
    "text": "Rozaduras, sequedad o cuidado corporal",
    "slug": "cuerpo-rozaduras",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "4eb2a5a6-16ee-474d-8387-c9b268a3bdf1",
    "question_id": "55550012-0002-0016-0000-000000000001",
    "text": "Cuidado general de pies y cuerpo",
    "slug": "pies-general",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "4edbc966-1f82-49f5-9576-a4fb6cf0081d",
    "question_id": "55550012-0002-0017-0000-000000000001",
    "text": "Ganar fuerza o masa muscular",
    "slug": "gym-fuerza",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "4fdb0f1b-0c0a-47e0-8510-3dbbbf75a3be",
    "question_id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "text": "Quiero cuidar mi piel o cabello",
    "slug": "guia-piel",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "514aa262-87a8-4fb5-a6a6-962b1c88d003",
    "question_id": "55550012-0002-0017-0000-000000000001",
    "text": "Recuperarme mejor después de entrenar",
    "slug": "gym-recuperacion",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "5336cd8a-8fd5-44b8-ad09-12808fde9659",
    "question_id": "55550012-0002-0002-0000-000000000001",
    "text": "Estoy empezando o entreno ocasional",
    "slug": "nivel-principiante",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0016-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "542710ff-871f-4ebf-aa12-01bcc695d05a",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "He tenido reacciones fuertes a productos similares",
    "slug": "cond-reacciones",
    "icon_url": null,
    "sort_order": 12,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0002-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Intolerancia a la lactosa",
    "slug": "alerg-lactosa",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0003-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Celiaquía / sin gluten",
    "slug": "alerg-gluten",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0004-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Alergia a la soya",
    "slug": "alerg-soya",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0005-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Sin azúcar",
    "slug": "alerg-azucar",
    "icon_url": null,
    "sort_order": 5,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0006-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Sin cafeína",
    "slug": "alerg-cafeina",
    "icon_url": null,
    "sort_order": 6,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0007-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Vegano/a",
    "slug": "pref-vegano",
    "icon_url": null,
    "sort_order": 7,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "55550013-0005-0008-0000-000000000001",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Sin fragancias",
    "slug": "pref-sin-fragancia",
    "icon_url": null,
    "sort_order": 8,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "56d3a574-9405-4e70-acdf-1b1ef8019658",
    "question_id": "55550012-0002-0008-0000-000000000001",
    "text": "No puedo dormir bien o mi sueño es malo",
    "slug": "foco-sueno",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0009-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "579a145e-e8e6-455a-aa65-a794002d6d30",
    "question_id": "55550012-0002-0014-0000-000000000001",
    "text": "Playa o destino tropical",
    "slug": "viaje-playa",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "580b2dc1-2f07-4a55-9a4d-f9553e3d4984",
    "question_id": "55550012-0002-0004-0000-000000000001",
    "text": "Mi piel (cara, tono, manchas, poros)",
    "slug": "foco-piel",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "58e81274-9493-4926-8913-6937228ab436",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Alérgico/a a la soya",
    "slug": "alerg-soya",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "5a88077f-20df-4c45-bb49-66c79b958458",
    "question_id": "55550012-0002-0002-0000-000000000001",
    "text": "Entreno regularmente (2-3x por semana)",
    "slug": "nivel-activo",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0014-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "5d230e3a-7bda-4b09-9b3a-d91041fb0791",
    "question_id": "55550012-0002-0017-0000-000000000001",
    "text": "Mejorar energía para entrenar",
    "slug": "gym-energia",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "5d443e51-13aa-4428-9349-19d08840e10f",
    "question_id": "55550012-0002-0006-0000-000000000001",
    "text": "Arrugas y pérdida de firmeza",
    "slug": "piel-arrugas",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "5fccac90-c045-4278-aad8-c4ed2ebf0470",
    "question_id": "55550012-0002-0005-0000-000000000001",
    "text": "Grasa o mixta, con poros y brillos",
    "slug": "piel-grasa",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0017-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "61f7e8fd-edb9-4829-930a-9475ffc204fb",
    "question_id": "55550012-0002-0009-0000-000000000001",
    "text": "Solo en épocas de carga o estrés",
    "slug": "frecuencia-ocasional",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "6a4e9552-d0b5-409e-8ab7-24b94660bffb",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Mi descanso, calma o energía diaria",
    "slug": "obj-bienestar",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0012-0000-0000-0000-000000000000",
      "aaaa0009-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "6aa392e1-71e1-43aa-a36e-ece6e7869025",
    "question_id": "55550012-0003-0004-0000-000000000001",
    "text": "Un ritual equilibrado",
    "slug": "presupuesto-medio",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "6d9f7ac2-7c7d-4232-8891-51d0554497b3",
    "question_id": "55550012-0003-0004-0000-000000000001",
    "text": "Lo esencial — solo lo que necesito",
    "slug": "presupuesto-bajo",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "6df390a2-cec5-4ae7-8508-84acb3727db9",
    "question_id": "55550012-0003-0004-0000-000000000001",
    "text": "La experiencia LIORA — lo mejor de lo mejor",
    "slug": "presupuesto-premium",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "7396c578-66a5-4a42-b093-481e474bdff8",
    "question_id": "55550012-0003-0006-0000-000000000001",
    "text": "Balanceada, lo necesario",
    "slug": "rutina-balanceada",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "76737301-66e6-42ef-a0cb-a7a06b7d35d2",
    "question_id": "55550012-0003-0002-0000-000000000001",
    "text": "No, sin problemas",
    "slug": "sin-sensibilidad",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "770f0f85-c39b-49c2-b7c3-6994cbeba8af",
    "question_id": "55550012-0002-0004-0000-000000000001",
    "text": "Colágeno y belleza desde adentro (piel + cabello + uñas)",
    "slug": "foco-colageno",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "78db9a5e-9529-49b4-ba88-12d66f78e38b",
    "question_id": "55550012-0002-0001-0000-000000000001",
    "text": "Fuerza y musculación",
    "slug": "tipo-fuerza",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0002-0000-0000-0000-000000000000",
      "aaaa0013-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "7d6fd071-f121-409e-88ce-c4a70e4ea800",
    "question_id": "55550012-0002-0005-0000-000000000001",
    "text": "Seca o deshidratada",
    "slug": "piel-seca",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0018-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "7d95fd1b-dabc-49d8-9be9-89d68d5a91d6",
    "question_id": "55550012-0002-0014-0000-000000000001",
    "text": "Vuelo largo o varios destinos",
    "slug": "viaje-largo",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "80380ab8-469d-4587-a19b-8424c332af67",
    "question_id": "55550012-0002-0013-0000-000000000001",
    "text": "Playa, piscina o deportes acuáticos",
    "slug": "solar-playa",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "8158bee9-ce84-4f0d-a6db-b20c597c96dc",
    "question_id": "55550012-0002-0008-0000-000000000001",
    "text": "Me falta energía durante el día",
    "slug": "foco-energia",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0001-0000-0000-0000-000000000000",
      "aaaa0008-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "8206fc4d-946e-4b3a-9094-215291480cfd",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Vegano/a",
    "slug": "pref-vegano",
    "icon_url": null,
    "sort_order": 7,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "85832e48-10c0-4ba1-97c1-ffb2b75e8caf",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Mis pies o cuidado corporal",
    "slug": "obj-pies-cuerpo",
    "icon_url": null,
    "sort_order": 8,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "8be277bc-05a5-4ae7-9dd9-c372c5e38716",
    "question_id": "55550012-0002-0012-0000-000000000001",
    "text": "No es mi prioridad — quiero resultados",
    "slug": "natural-indiferente",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "8c2620e1-aecc-4933-9ced-de93ce0784d0",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Embarazo o lactancia",
    "slug": "cond-embarazo",
    "icon_url": null,
    "sort_order": 9,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "8f4458bf-f6a0-44ed-a562-ba7bef3f9d9c",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Mi hogar, familia o primeros auxilios",
    "slug": "obj-hogar",
    "icon_url": null,
    "sort_order": 7,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "8f57612b-b141-472b-907d-998b1957b360",
    "question_id": "55550012-0002-0002-0000-000000000001",
    "text": "Entreno fuerte (4 o más veces por semana)",
    "slug": "nivel-alto",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0013-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "8fef7f25-f8af-4727-9cc6-d3538bdc43c7",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Orgánico / natural",
    "slug": "pref-organico",
    "icon_url": null,
    "sort_order": 9,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "9020e069-9b91-46df-b666-6938aec75a17",
    "question_id": "55550012-0002-0010-0000-000000000001",
    "text": "Reflujo o acidez",
    "slug": "digestivo-reflujo",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0011-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "9229080e-5a20-4338-81e3-e47565aff4ec",
    "question_id": "55550012-0002-0006-0000-000000000001",
    "text": "Manchas y tono desigual",
    "slug": "piel-manchas",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "95951002-f2c4-41e4-a5e5-772112fcf8b2",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Vitaminas y nutrición de base",
    "slug": "obj-nutricion",
    "icon_url": null,
    "sort_order": 9,
    "tag_ids": [
      "aaaa0005-0000-0000-0000-000000000000",
      "aaaa0001-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "95d2d91b-6885-4c4a-996c-beca74f1e203",
    "question_id": "55550012-0002-0001-0000-000000000001",
    "text": "Cardio, running o ciclismo",
    "slug": "tipo-cardio",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0002-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "990b310f-66b6-4b5d-9a5d-db6c20584d34",
    "question_id": "55550012-0002-0007-0000-000000000001",
    "text": "Crecimiento muy lento",
    "slug": "cabello-crecimiento",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "992de78e-971d-439b-a624-1644a4555db5",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Sin azúcar",
    "slug": "alerg-azucar",
    "icon_url": null,
    "sort_order": 5,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "9e6678b9-4d51-44d9-bf6c-f909ad3d304e",
    "question_id": "55550012-0002-0007-0000-000000000001",
    "text": "Caída o debilitamiento del cabello",
    "slug": "cabello-caida",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "a078bdd9-7c34-416d-ba29-9da365a0ff62",
    "question_id": "55550012-0002-0015-0000-000000000001",
    "text": "Botiquín familiar completo para casa",
    "slug": "hogar-familiar",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "a26669ce-818a-45db-b30f-432c97246ffb",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Tengo una condición médica relevante",
    "slug": "cond-medica",
    "icon_url": null,
    "sort_order": 11,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "aa0ab7c8-6e4e-4573-a8c2-07ee472188f7",
    "question_id": "55550012-0003-0002-0000-000000000001",
    "text": "Me salen rojeces o irritación con facilidad",
    "slug": "piel-rojeces",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0020-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "aa55856c-5326-4c75-ba5a-47f85687364a",
    "question_id": "55550012-0002-0010-0000-000000000001",
    "text": "Estreñimiento o tránsito lento",
    "slug": "digestivo-estrenimiento",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0011-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "b22ef100-18f5-45ef-a60b-c6d4c38d137a",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Tomo medicamentos o suplementos actualmente",
    "slug": "cond-medicamentos",
    "icon_url": null,
    "sort_order": 10,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "b70340c5-5bd2-49de-9afe-e861ec4713b8",
    "question_id": "55550012-0003-0005-0000-000000000001",
    "text": "Tengo síntomas intensos o persistentes",
    "slug": "cond-sintomas",
    "icon_url": null,
    "sort_order": 13,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "ba76bf36-627b-42d3-b3f5-f4a13b305d64",
    "question_id": "55550012-0002-0015-0000-000000000001",
    "text": "Para auto, cartera u oficina",
    "slug": "hogar-movil",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "baf5b741-e24d-416c-8aa1-b05293ddd433",
    "question_id": "55550012-0002-0013-0000-000000000001",
    "text": "Uso diario en ciudad, trabajo o exterior",
    "slug": "solar-diario",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "bcb788e9-62e9-409d-98ce-f3f38edd2c88",
    "question_id": "55550012-0003-0004-0000-000000000001",
    "text": "Una rutina completa",
    "slug": "presupuesto-alto",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "be0a886f-cbac-4bf6-b6e0-3a8fbb9540d6",
    "question_id": "55550012-0002-0005-0000-000000000001",
    "text": "Sensible o reactiva",
    "slug": "piel-sensible",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0020-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "bec2c4a2-32b8-45b8-b3d2-86288d469fb2",
    "question_id": "55550012-0003-0006-0000-000000000001",
    "text": "No sé, recomiéndenme",
    "slug": "rutina-guiada",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "c16b6c6c-a886-44a5-89ae-88c9ab9157e8",
    "question_id": "55550012-0002-0002-0000-000000000001",
    "text": "Nivel competitivo o élite",
    "slug": "nivel-elite",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0013-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "c5068ad2-9c90-4f1d-9fd3-50a4b6bd5249",
    "question_id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "text": "Quiero algo para gym o recuperación",
    "slug": "guia-gym",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "c5ba4d30-6594-4691-9f39-200dad86919f",
    "question_id": "55550012-0002-0009-0000-000000000001",
    "text": "Varias veces a la semana",
    "slug": "frecuencia-semanal",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0012-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "c7026a6c-7b9b-48d5-ae92-26820cecba0b",
    "question_id": "55550012-0002-0016-0000-000000000001",
    "text": "Recuperación muscular del cuerpo",
    "slug": "cuerpo-muscular",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "cbc84abc-fa07-4843-a125-1e759014a429",
    "question_id": "55550012-0002-0003-0000-000000000001",
    "text": "No, me muevo sin problemas",
    "slug": "sin-dolor",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0002-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "d146e0c1-ebe3-4188-8759-da2d6d15aa0b",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Protección solar",
    "slug": "obj-solar",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "d1701b37-0942-44a9-809b-b63373ee9c31",
    "question_id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "text": "Me siento con poca energía, estrés o sueño",
    "slug": "guia-bienestar",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "d2194569-7137-44ac-acf4-9a83457cf661",
    "question_id": "55550012-0001-0001-0000-000000000001",
    "text": "Mi piel, rostro o cabello",
    "slug": "obj-belleza",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "d5eb57ba-8e81-4ab0-a4d7-2d28d3d0d1c7",
    "question_id": "55550012-0003-0006-0000-000000000001",
    "text": "Muy simple, pocos productos",
    "slug": "rutina-simple",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "d93ce34b-3fd5-4887-92cc-032182234e11",
    "question_id": "55550012-0002-0006-0000-000000000001",
    "text": "Firmeza y luminosidad",
    "slug": "piel-firmeza",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0003-0000-0000-0000-000000000000",
      "aaaa0006-0000-0000-0000-000000000000",
      "aaaa0010-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "d989ab94-5936-4a0c-b46f-5cf2f48ee66b",
    "question_id": "55550012-0002-0008-0000-000000000001",
    "text": "Los dos: mal sueño y mucho estrés",
    "slug": "foco-sueno-estres",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0009-0000-0000-0000-000000000000",
      "aaaa0012-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "da126250-a617-4d28-ac8f-e5410a55a539",
    "question_id": "55550012-0002-0003-0000-000000000001",
    "text": "Sí, con frecuencia me molestan",
    "slug": "dolor-frecuente",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [
      "aaaa0010-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "e8e66769-4294-4368-ad73-7a77c6dd6962",
    "question_id": "55550012-0002-0011-0000-000000000001",
    "text": "Superalimentos andinos (maca, spirulina, cúrcuma)",
    "slug": "nutricion-andino",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0004-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "ea5d286b-8cbd-441a-822d-5df79464eeaf",
    "question_id": "55550012-0002-0012-0000-000000000001",
    "text": "Fundamental, solo lo natural",
    "slug": "prefiere-natural",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0004-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "ef20a604-3b0d-436a-8b31-bc3c1a3ba892",
    "question_id": "55550012-0002-0009-0000-000000000001",
    "text": "Casi todos los días",
    "slug": "frecuencia-diaria",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [
      "aaaa0012-0000-0000-0000-000000000000",
      "aaaa0009-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "f00bcdb7-a169-41c4-9d7c-e05583144ed3",
    "question_id": "55550012-0002-0014-0000-000000000001",
    "text": "Ciudad, trabajo o negocios",
    "slug": "viaje-ciudad",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "f03bb4d2-a9d8-4a5d-80a7-104d9b696289",
    "question_id": "55550012-0002-0013-0000-000000000001",
    "text": "Todo lo anterior, quiero protección completa",
    "slug": "solar-completo",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "f2974415-d6ed-414c-9e1e-aaab2d5b550f",
    "question_id": "55550012-0002-0008-0000-000000000001",
    "text": "Paso muchas horas frente a pantallas",
    "slug": "foco-pantallas",
    "icon_url": null,
    "sort_order": 5,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "f5a2bcdf-eb67-45c4-a9aa-9107a1971fd2",
    "question_id": "ba9c0d19-82d9-40fe-b91c-0de2dba7fe64",
    "text": "Quiero un botiquín o cuidado para casa",
    "slug": "guia-hogar",
    "icon_url": null,
    "sort_order": 6,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "f6499c5a-ebe8-46fd-8b5f-69b127d4a0c6",
    "question_id": "55550012-0002-0011-0000-000000000001",
    "text": "Fortalecer mi sistema inmune",
    "slug": "nutricion-inmune",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0005-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "f7765671-036c-4437-8b8a-ad97593e3569",
    "question_id": "55550012-0002-0010-0000-000000000001",
    "text": "Quiero una rutina digestiva más ligera",
    "slug": "digestivo-reset",
    "icon_url": null,
    "sort_order": 4,
    "tag_ids": [
      "aaaa0011-0000-0000-0000-000000000000",
      "aaaa0004-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "fbd133a4-7d13-41d1-a6a5-e4491c2bc793",
    "question_id": "55550012-0002-0003-0000-000000000001",
    "text": "A veces, después de entrenar",
    "slug": "dolor-leve",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0002-0000-0000-0000-000000000000",
      "aaaa0010-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "fc314815-d147-4be5-b803-0aed6c2e84dd",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Sin cafeína",
    "slug": "alerg-cafeina",
    "icon_url": null,
    "sort_order": 6,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "fd535872-8413-41da-ba02-03d200a86592",
    "question_id": "55550012-0002-0004-0000-000000000001",
    "text": "Mi cabello (caída, brillo, frizz)",
    "slug": "foco-cabello",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0006-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  },
  {
    "id": "fea3d757-b92b-42e9-9d2f-1ae17ce1ecfb",
    "question_id": "55550012-0002-0016-0000-000000000001",
    "text": "Pies cansados, callos o durezas",
    "slug": "pies-durezas",
    "icon_url": null,
    "sort_order": 1,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "fee3190b-2457-47ca-aa62-6c5781d0775c",
    "question_id": "55550012-0003-0001-0000-000000000001",
    "text": "Celíaca / sin gluten",
    "slug": "alerg-gluten",
    "icon_url": null,
    "sort_order": 3,
    "tag_ids": [],
    "next_question_id": null
  },
  {
    "id": "ffe86053-d647-45a8-9f2b-f32c4e4b3b4d",
    "question_id": "55550012-0002-0012-0000-000000000001",
    "text": "Importante, pero no excluyente",
    "slug": "natural-importante",
    "icon_url": null,
    "sort_order": 2,
    "tag_ids": [
      "aaaa0004-0000-0000-0000-000000000000"
    ],
    "next_question_id": null
  }
]
$quiz$::jsonb)
on conflict (id) do nothing;
