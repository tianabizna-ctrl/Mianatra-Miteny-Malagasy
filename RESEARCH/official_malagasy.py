#!/usr/bin/env python3
"""Convert Tsimihety dialect forms into Official Malagasy across the course pack.

Called by build_app_data.py so the shipped dataset teaches Official Malagasy
(Tenim-pirenena ofisialy) throughout: vocabulary, phrases, dialogues, grammar
examples/explanations, and cultural notes.
"""

import re

# 1. Pure-Tsimihety vocabulary IDs that are duplicates of an Official Malagasy
#    word already present in the dictionary.
DROP_VOCAB_IDS = {
    "tsm:zama", "tsm:angovavy", "tsm:tragno", "tsm:tafo_tanimanga", "tsm:tragnobe",
    "tsm:lakôro", "tsm:rimba", "tsm:etazy", "tsm:escalier", "tsm:rangalava",
    "tsm:geda", "tsm:hely", "tsm:ambo", "tsm:iva", "tsm:mahety", "tsm:maratra",
    "tsm:mamondro", "tsm:misokatra", "tsm:manokatra", "tsm:mifôdy", "tsm:mamody",
    "tsm:managala", "tsm:langitry", "tsm:vôndro", "tsm:mahamay", "tsm:manintsy",
    "tsm:asaratra", "tsm:maintany", "tsm:sadrô", "tsm:sajô", "tsm:mitsabo",
    "tsm:zahay", "tsm:areo", "tsm:karaoty", "tsm:mitaly", "tsm:sôfigny",
    "tsm:hongotro", "tsm:bôko", "tsm:havay", "tsm:misatra", "tsm:mandoà",
    "tsm:fôlaka", "tsm:bekibo", "tsm:lera", "tsm:montre", "tsm:kandindagna",
    "tsm:masôva", "tsm:aketo_(tsm)", "tsm:moa", "tsm:manasa_kapila_(tsm)",
    "tsm:aan", "tsm:een",
    # Standalone Tsimihety duplicates whose Official Malagasy word already exists:
    "amarainy", "amarainy_koa", "mahamay", "manintsy", "ino_vaovao", "boriky",
    "zebu_(english/french_word_used_in_the_lesson)",
    "koà", "làmàlana", "(iray)_alina", "(iray)_hetsy", "manadio_(trano)", "misy_..._ve",
    "tsisy_fisaorana", "zaho", "homana", "ohatrino(na)",
    "ronono_(spell-check;_also_'ronono')", "ve_(revision)",
    "fiaramanidina_(fiara_+_manidina)", "cousin(e)_fr",
    # Unassimilated French/English dictionary appendix stubs & OCR duplicate
    "architecte_fr", "maillot_de_bain_fr", "addition_fr", "buffet_fr", "bus_fr",
    "jambon_fr", "confiture_fr", "musee_fr", "prive_fr", "restaurant_fr",
    "complet_fr", "zoo_fr", "hamburger", "bungalow", "disc", "zebu", "fnzidera",
}

DROP_PHRASE_IDS = {
    "manana_zanaka_____aho", "mila_____aho_azafady", "omeo_____aho_azafady",
    "wvm_ariary_(ar)_—_one_ariary_=_5_old_malagasy_francs",
    "rpb_fr",
}

# 2. Vocabulary entries whose `mg` (and optionally `en` / `note`) are replaced
#    with their Official Malagasy equivalents.
VOCAB_REWRITES = {
    "manakory": {
        "mg": "Manao ahoana?",
        "en": "How are you?",
        "note": "Everyday greeting. To several people: 'Manao ahoana ianareo?'",
    },
    "anarako": {
        "mg": "... no anarako",
        "en": "my name is ...",
        "note": "Official Malagasy places the name first: 'Faly no anarako.'",
    },
    "asako": {
        "mg": "... no asako",
        "en": "my job is ...",
        "note": "Official Malagasy places the job first: 'Mpampianatra no asako.'",
    },
    "manakory_zareo": {
        "mg": "Manao ahoana izy ireo?",
        "en": "How are they?",
        "note": "",
    },
    "tsm:iadabe": {
        "mg": "rahalahin-dray zokiny",
        "en": "uncle (paternal, elder)",
        "note": "Father's elder brother (also addressed as Dadatoa).",
    },
    "tsm:iadahely": {
        "mg": "rahalahin-dray zandriny",
        "en": "uncle (paternal, younger)",
        "note": "Father's younger brother (also addressed as Dadanaivo / Dadapara).",
    },
    "tsm:ninibe": {
        "mg": "rahavavin-dreny zokiny",
        "en": "aunt (maternal, elder)",
        "note": "Mother's elder sister (also addressed as Nenitoa).",
    },
    "tsm:ninihely": {
        "mg": "rahavavin-dreny zandriny",
        "en": "aunt (maternal, younger)",
        "note": "Mother's younger sister (also addressed as Neninaivo / Nenipara).",
    },
    "tsm:mitsabo_tragno": {
        "mg": "manorina trano",
        "en": "to build a house",
        "note": "",
    },
    "tsm:zany": {
        "mg": "izany",
        "en": "so / that",
        "note": "Used as 'Mpamboly sy mpiompy izany ianao?' — so you're a farmer and breeder?",
    },
    "tsm:tsy_mahazo_onon-draha": {
        "mg": "tsy mahatsiaro tena",
        "en": "unconscious",
        "note": "",
    },
    "tsm:azon'ny_tontona": {
        "mg": "mandeha ra ny orona",
        "en": "nosebleed",
        "note": "",
    },
    # Slash-paired vocabulary entries where Tsimihety was paired with Official:
    "manofa_/_mamondro": {"mg": "manofa", "en": "to rent"},
    "veloma/mazotoa_+_harivariva_koa": {"mg": "Veloma hariva koa", "en": "see you in the afternoon"},
    "veloma/mazotoa_+_rahampitso_(off)_/_amarainy_(tsm)_koa": {"mg": "Veloma rahampitso koa", "en": "see you tomorrow"},
    "veloma/mazotoa_+_alarobia_koa": {"mg": "Veloma Alarobia koa", "en": "see you on Wednesday (formula extends to any specific day of the week)"},
    "homanatsm_/_mihinana_off": {"mg": "mihinana", "en": "to eat"},
    "mazotoa_homana_(tsm)_/_mihinana_(off)": {"mg": "Mazotoa mihinana", "en": "enjoy your meal (bon appétit)"},
    "miandrasa_sakafo_(off)_/_mandesa_hagniny_(tsm)": {"mg": "Miandrasa sakafo", "en": "Wait for the meal (said to visitors about to leave before the meal is ready)"},
    "lehilahy_(off)_/_lalahy_(tsm)": {"mg": "Lehilahy", "en": "boy / man / male (the same word covers boy, man and male)"},
    "vehivavy_(off)_/_vaiavy_(tsm)": {"mg": "Vehivavy", "en": "girl / woman / female (the same word covers girl, woman and female)"},
    "amezo_(tsm)_/_omeo_(off)": {"mg": "Omeo", "en": "give me"},
    "tsisy_madinika_(off)_/_tsisy_la_monnaie_/_lamonnaie_(tsm)": {"mg": "Tsy misy madinika", "en": "no change (madinika = small change)"},
    "tomaty_/_voatabia": {"mg": "Voatabia", "en": "tomatoes"},
    "tomaty/voatabia_3_toko": {"mg": "Voatabia telo toko", "en": "3 piles of tomatoes"},
    "fontsy_(tsm)_/_akondro_(off)": {"mg": "Akondro", "en": "bananas"},
    "mipetraka_/_mantotry": {"mg": "Mipetraka", "en": "sit down"},
    "mivavaka_/_hivavaka_antsika": {"mg": "Hivavaka isika", "en": "let us pray"},
    "zagnahary_/_andriamanitra": {"mg": "Andriamanitra", "en": "the Creator God"},
    "ny_fiara_(off)_/_tomobilina_(tsm)": {"mg": "Ny fiara", "en": "car / vehicle"},
    "ny_sakafo_(off)_/_hagniny_(tsm)": {"mg": "Ny sakafo", "en": "food / meal"},
    "ny_lanitra_(off)_/_langitry_(tsm)": {"mg": "Ny lanitra", "en": "sky / heaven"},
    "ny_kintana_(off)_/_lakintana_(tsm)": {"mg": "Ny kintana", "en": "stars"},
    "eny_(off)_/_ia_(tsm)": {"mg": "Eny", "en": "yes"},
    "tsia_(off)_/_ehe_(tsm)": {"mg": "Tsia", "en": "no"},
    "fa_maninona_(off)_/_manino_(tsm)": {"mg": "Fa maninona", "en": "why"},
    "pelmosy_/_voasary_be_(tsm:_tsoa_be)": {"mg": "voasary be", "en": "grapefruit"},
    "courgette_/_korzety": {"mg": "korzety", "en": "courgette / zucchini"},
    "hitsin-dàlana_/_làlamanitsy": {"mg": "hitsin-dàlana", "en": "shortcut"},
    "adiny_(off)_/_lera_(tsm)": {"mg": "adiny", "en": "hour (used to express distance: 'làlana adiny telo' = a 3-hour journey)"},
    "hopitaly_/_hôpitaly_/_lôpitaly_(tsm)": {"mg": "hopitaly", "en": "hospital"},
    "zoro_/_amin'ny_zoro": {"mg": "amin'ny zoro", "en": "at the corner"},
    "afovoany_(off)_/_anivo_(tsm)": {"mg": "afovoany", "en": "in the middle of"},
    "aoriana_(off)_/_afara_(tsm)": {"mg": "aoriana", "en": "after / behind"},
    "miarahaba_/_magname_salama_(tsm)": {"mg": "miarahaba", "en": "to greet"},
    "mipetraka_/_mantotry_(tsm)": {"mg": "mipetraka", "en": "to sit down"},
    "fakan-drivotra_/_ravankely_(tsm)": {"mg": "fakan-drivotra", "en": "break / recreation (at school)"},
    "vao_/_alôhaka_(tsm)": {"mg": "vao", "en": "just / as soon as (as in 'raha vao')"},
    "famantaranandro_(off)_/_montre_(tsm)": {"mg": "famantaranandro", "en": "wall clock / watch"},
    "varavarana_(off)_/_tamiagna_(tsm)": {"mg": "varavarana", "en": "door"},
    "arimoara_(off)_/_lalimoara_(tsm)": {"mg": "arimoara", "en": "wardrobe / cupboard"},
    "etazera_(off)_/_tazera_(tsm)": {"mg": "talantalana", "en": "shelf"},
    "mihaino_/_mitandregny_(tsm)": {"mg": "mihaino", "en": "to listen"},
    "miresaka_/_mikoragna_(tsm)": {"mg": "miresaka", "en": "to talk / speak"},
    "milalao_/_misoma_(tsm)": {"mg": "milalao", "en": "to play"},
    "mianjera_/_lavo_(tsm)": {"mg": "mianjera", "en": "to fall down"},
    "mivoaka_/_miboaka_(tsm)": {"mg": "mivoaka", "en": "to exit / go out"},
    "miantsena_(off)_/_manao_bazary_(tsm)": {"mg": "miantsena", "en": "to go to the market / to go shopping"},
    "mitoto_vary_(off)_/_mandisa_vary_(tsm)": {"mg": "mitoto vary", "en": "to pound the rice"},
    "maka_rano_(off)_/_mala-drano_(tsm)": {"mg": "maka rano", "en": "to fetch water"},
    "maka_kitay_(off)_/_malaka_hazomoaty_(tsm)": {"mg": "maka kitay", "en": "to pick / collect firewood"},
    "manary_fako_(off)_/_magnary_ahitry_(tsm)": {"mg": "manary fako", "en": "to take the rubbish out"},
    "miakanjo_/_manao_akanjo_(tsm:_magnano_ankanjo)": {"mg": "manao akanjo", "en": "to get dressed / put on clothes"},
    "miala_sasatra_/_maka_aina_(tsm:_magnala_disaka)": {"mg": "miala sasatra", "en": "to rest / take a break"},
    "aho_/_zaho": {"mg": "aho", "en": "I (used in the sentence pattern 'verb + aho + amin'ny ...')"},
    "saha_/_tanimbary_(tsm:_vilogno_/_taimbary)": {"mg": "tanimbary", "en": "rice field"},
    "fijanonan'ny_fiara_/_parking": {"mg": "fijanonan'ny fiara", "en": "car park"},
    "tapakila_/_billet": {"mg": "tapakila", "en": "ticket"},
    "mpamily_/_sofera": {"mg": "mpamily", "en": "driver"},
    "mpivarotra_tapakila_/_guichet": {"mg": "mpivarotra tapakila", "en": "ticket seller (ticket office clerk)"},
    "toerana_/_plasy": {"mg": "toerana", "en": "seat / place"},
    "an'inona?_(off)_/_an'ino_moa?_(tsm)": {"mg": "an'inona?", "en": "what place ...? / where is this place?", "mg_alt": ""},
    "ampahefatradiny_/_ampahefadera_(tsm)": {"mg": "ampahefatradiny", "en": "15 minutes (a quarter hour)", "mg_alt": ""},
    "manafa_vilia_(off)_/_manafa_kapila_(tsm)": {"mg": "manafa vilia", "en": "to dry the dishes", "mg_alt": ""},
    "eto_ve_/_eto_moa": {"mg": "eto ve", "en": "is it here ...? (question with 've')", "mg_alt": ""},
    "mandoa_vola_/_frais_(tsm:_magnefa_vola)": {"mg": "mandoa vola", "en": "to pay (money / fare)"},
    "mikatona_/_mamody_(tsm)_/_mifody_(tsm)": {"mg": "mikatona", "en": "to be closed"},
    "miova_/_mifindra": {"mg": "mifindra", "en": "to change (bus)"},
    "ao_/_eto": {"mg": "eto", "en": "here"},
    "dada_/_ray": {"mg": "ray", "en": "father (also dada)"},
    "neny_/_reny": {"mg": "reny", "en": "mother (also neny)"},
    "vola_/_ariary": {"mg": "ariary", "en": "Malagasy currency"},
    "wc_/_trano_fivoahana": {"mg": "trano fivoahana", "en": "toilet"},
    "fotoan'ny_orana_/_fahavaratra": {"mg": "fahavaratra", "en": "rainy season"},
    "rasazy": {"mg": "mpampivelona", "en": "midwife (also rasazy)"},
    "tsisy": {"mg": "tsy misy", "en": "there is not / nothing", "note": "Standard negation of misy (there is/are)."},
    "tsisy_marary": {"mg": "Tsy misy marary.", "en": "There is no pain / nobody is sick."},
    "tsy_manambady_zaho": {"mg": "Tsy manambady aho", "en": "I am not married / I am single"},
    "mananjanaka_..._(number)_..._zahay": {"mg": "Manana zanaka izahay", "en": "We have children (exclusive we)"},
    "..._(number)_lalahy_..._(number)_vaiavy": {"mg": "lahy iray sy vavy roa", "en": "one son and two daughters"},
    "ia,_misy": {"mg": "Eny, misy", "en": "yes, there are"},
    "manakory_areo": {"mg": "Manao ahoana ianareo?", "en": "how are you all? (you - plural)"},
    "hitsangana_antsika": {"mg": "Hitsangana isika", "en": "Let us stand"},
    "hihira_antsika": {"mg": "Hihira isika", "en": "Let us sing"},
    "hamaky_ny_tenin'andriamanitra_antsika": {"mg": "Hamaky ny tenin'Andriamanitra isika", "en": "We will read God's word together"},
    "antsika": {"mg": "antsika", "en": "us / ours (inclusive object/possessive pronoun)"},
    "mazotoa_homana": {"mg": "Mazotoa mihinana!", "en": "Enjoy your meal! (bon appétit)", "note": "Reply: 'Misaotra, ianao koa.'"},
    "fahazotoa-homana": {"mg": "fahazotoam-pihinana", "en": "appetite"},
    "kôka": {"mg": "koka", "en": "cola / soda"},
    "jôgy": {"mg": "jogy", "en": "carafe, decanter"},
    "siô": {"mg": "sio", "en": "bucket"},
    "tôrana": {"mg": "torana", "en": "unconscious"},
    "rahalahy_(as_title)": {"mg": "rahalahy", "en": "brother (friendly address to any man)"},
    "tongolo_be_(be_=_big)": {"mg": "tongolo be", "en": "purple / large onions"},
    "vani(o)_-_the_o_is_silent": {"mg": "voanio", "en": "coconut", "note": "The final -o is barely voiced."},
    "fihirana_ffpm_(fiombonan'ny_fiangonana_protestanta_eto_madagasikara)": {
        "mg": "Fihirana FFPM",
        "en": "the official Protestant hymnbook (Fiombonan'ny Fiangonana Protestanta eto Madagasikara)",
    },
    "andriamanitra_o..._amen": {"mg": "Andriamanitra ô, Amena", "en": "O God, Amen (prayer closing)"},
    "fiarandalamby_(fiara_+_làlana_+_vy)": {
        "mg": "fiarandalamby",
        "en": "train (lit. 'a vehicle whose road is made of iron': fiara + làlana + vy)",
    },
    "manontany_asleep_ad)": {"mg": "manontany", "en": "to ask"},
    "tsy_ao_(not_in)": {"mg": "tsy ao", "en": "away / not in"},
    "bisoki_(cookie)": {"mg": "bisikoitra", "en": "biscuit / cookie"},
    "miborosy_(hair": {"mg": "miborosy", "en": "to brush"},
    "mirehatra_(light": {"mg": "mirehatra", "en": "to burn / be lit"},
    "fotoana_(time)": {"mg": "fotoana", "en": "date / time"},
    "tsentsi-nify_(teeth)": {"mg": "tsentsi-nify", "en": "dental filling"},
    "solomaso_(eye)": {"mg": "solomaso", "en": "eyeglasses"},
    "kamiao_(truck)": {"mg": "kamiao", "en": "lorry / truck"},
    "fandidiana_(chirurgical)": {"mg": "fandidiana", "en": "surgical operation"},
    "voasary_(fruit)": {"mg": "voasary", "en": "orange (fruit)"},
    "pejy_(of_a_book)": {"mg": "pejy", "en": "page (of a book)"},
    "fotoana_voafetra_(of_time)": {"mg": "fotoana voafetra", "en": "period of time"},
    "fako_(garbage)": {"mg": "fako", "en": "rubbish / garbage"},
    "lohataona_(season)": {"mg": "lohataona", "en": "spring (season)"},
    "petra-bola_(bonds_and_other_commercial_papers)": {"mg": "petra-bola", "en": "savings / deposit"},
    "eny_(visible)": {"mg": "eny", "en": "there (visible)"},
}

# Clean vocabulary notes that mention Tsimihety
VOCAB_NOTE_REWRITES = {
    "eny": "In reply to 'Misy ... ve?': 'Eny, misy' = yes, there is/are.",
    "zanaka_vavy": "Counting children: 'Manana zanaka telo izahay: lahy iray, vavy roa.' = We have three children: one boy, two girls.",
    "anadahin-dreny": "Literally 'mother's brother' (anadahy = brother of a woman, reny = mother).",
    "maitso": "'Maitsomaitso' = greenish. Watch out: 'mahitsy' means straight/upright!",
    "volontany": "Lit. 'earth coloured' (volo = colour, tany = soil).",
    "ora": "Also 'watch/clock' in the compound famantaranandro.",
    "amin'ny_firy_izao_azafady": "Polite way to ask the time.",
    "mafana": "'Mafana ny andro' = it's hot.",
    "tanalahy": "Lit. 'master of the forest'.",
    "vorontsiloza": "Lit. 'blue-peacock bird'.",
    "valala": "Traditionally eaten toasted!",
    "voromailala": "Symbol of peace.",
    "voan'ny_sery_aho": "Lit. 'caught by a cold'.",
    "tafo_taila": "Tiled / terracotta roof.",
    "rihana": "Storey or floor in a multi-level house.",
    "manao_trano": "'Manao / manamboatra trano' = to build a house.",
    "mijery_fahitalavitra": "To watch television.",
    "ianareo": "Plural or polite singular 'you'.",
    "izy_ireo": "Plural 'they'.",
    "ny_andro": "'Manao ahoana ny andro?' = How is the weather?",
}

# 3. Phrase rewrites
PHRASE_REWRITES = {
    "manakory_ianao": {
        "mg": "Manao ahoana ianao?",
        "en": "How are you?",
        "note": "Standard polite greeting.",
    },
    "mananjanaka_telo_zahay:_lahy_iray,_vavy_roa": {
        "mg": "Manana zanaka telo izahay: lahy iray, vavy roa.",
        "en": "We have three children: one boy, two girls.",
    },
    "ia,_misy": {
        "mg": "Eny, misy.",
        "en": "Yes, there are.",
    },
    "tsisy": {
        "mg": "Tsy misy.",
        "en": "There aren't / we're out.",
    },
    "tsisy_fisaorana": {
        "mg": "Tsy misy fisaorana.",
        "en": "Not at all / don't mention it.",
    },
    "manana_zanaka_____aho": {
        "mg": "Manana zanaka ___ aho.",
        "en": "I have ___ (number) children.",
        "note": "Or: 'Manana zanaka izahay' = we (exclusive) have children.",
    },
    "ruth_no_anarako": {
        "mg": "Ruth no anarako.",
        "en": "My name is Ruth.",
        "note": "Official Malagasy puts the name before 'no anarako'.",
    },
    "rpb_mazotoa_homana": {
        "mg": "Mazotoa mihinana!",
        "en": "Bon appétit! (eat well)",
    },
    "wv_hotel": {
        "mg": "hotely",
        "en": "hotel",
    },
    "mandr\u0435raka_izany": {
        "mg": "Mandreraka izany.",
        "en": "It's tiring.",
    },
}

# 4. Dialogue line rewrites: keyed by (dialogue_id, line_index) -> {"mg": ..., "en": ...}
DIALOGUE_LINE_REWRITES = {
    ("dlg_greet_and_farewell", 3): {"mg": "Salama tompoko. Manao ahoana ianao?", "en": "Hello. How are you?"},
    ("dlg_greet_and_farewell", 5): {"mg": "Inona ny vaovao?", "en": "What's new?"},
    ("dlg_greet_and_farewell", 6): {"mg": "Tsy misy vaovao.", "en": "Nothing's new."},

    ("dlg_market_shopping", 1): {"mg": "Mandrosoa!", "en": "Come in / come and buy!"},
    ("dlg_market_shopping", 5): {"mg": "Eny, misy.", "en": "Yes, there are."},
    ("dlg_market_shopping", 6): {"mg": "Ohatrinona?", "en": "How much are they?"},
    ("dlg_market_shopping", 8): {"mg": "Omeo telo azafady.", "en": "Give me three, please."},
    ("dlg_market_shopping", 9): {"mg": "Azafady, tsy misy madinika.", "en": "Sorry, no change."},

    ("dlg_directions_travel", 3): {"mg": "Tsy misy fisaorana.", "en": "Not at all."},

    ("dlg_time_appointments", 1): {"mg": "Eny! Rahoviana?", "en": "Yes! When?"},

    ("dlg_weather_smalltalk", 0): {"mg": "Salama tompoko! Manao ahoana ny andro?", "en": "Hello! How is the weather?"},

    ("dlg_transport_travel", 1): {"mg": "Eny, mandeha any Mandritsara izy.", "en": "Yes, it goes to Mandritsara."},

    ("dlg_intro_1a_11", 2): {"mg": "Manao ahoana ianao?", "en": "How are you?"},
    ("dlg_intro_1a_11", 4): {"mg": "Inona ny vaovao?", "en": "What's new?"},
    ("dlg_intro_1a_11", 5): {"mg": "Tsy misy vaovao.", "en": "Nothing's new."},

    ("dlg_intro_1a_12", 3): {"mg": "Salama tompoko. Manao ahoana ianao?", "en": "Hello, sir. How are you?"},
    ("dlg_intro_1a_12", 5): {"mg": "Inona ny vaovao?", "en": "What's new?"},
    ("dlg_intro_1a_12", 6): {"mg": "Tsy misy vaovao.", "en": "Nothing's new."},
    ("dlg_intro_1a_12", 7): {"mg": "Misaotra tompoko.", "en": "Thank you, sir."},

    ("dlg_intro_1b_13", 0): {"mg": "Mazotoa mihinana!", "en": "Enjoy your meal (bon appétit)"},
    ("dlg_intro_1b_13", 1): {"mg": "Misaotra, ianao koa!", "en": "Thank you, you too"},

    ("dlg_intro_2_14", 1): {"mg": "TSY MISY FISAORANA", "en": "Not at all / no need for thanks"},

    ("dlg_intro_2_20", 1): {"mg": "MISAOTRA, IANAO KOA", "en": "Thank you, you too"},

    ("dlg_intro_3_21", 0): {"mg": "Faly no anarako.", "en": "My name is Faly."},
    ("dlg_intro_3_21", 1): {"mg": "Avy any Angletera aho.", "en": "I am from England."},
    ("dlg_intro_3_21", 2): {"mg": "Mpampianatra no asako.", "en": "My job is teacher."},
    ("dlg_intro_3_21", 3): {"mg": "Tonga soa eto Madagasikara!", "en": "Welcome to Madagascar!"},
    ("dlg_intro_3_21", 4): {"mg": "Faly mahafantatra anao!", "en": "Pleased to know you / pleased to meet you!"},
    ("dlg_intro_3_21", 5): {"mg": "Faly mandray anao!", "en": "Happy to welcome you!"},

    ("dlg_intro_3_22", 0): {"mg": "Manambady aho.", "en": "I am married."},
    ("dlg_intro_3_22", 1): {"mg": "Tsy manambady aho.", "en": "I am single / not married."},
    ("dlg_intro_3_22", 2): {"mg": "Manana zanaka aho.", "en": "I have children."},
    ("dlg_intro_3_22", 3): {"mg": "Manana zanaka telo izahay.", "en": "We have three children."},
    ("dlg_intro_3_22", 4): {"mg": "Lahy iray sy vavy roa.", "en": "One son and two daughters."},

    ("dlg_intro_4_23", 1): {"mg": "Mandrosoa", "en": "Come in / come closer"},
    ("dlg_intro_4_23", 5): {"mg": "Eny, misy.", "en": "Yes, there are."},
    ("dlg_intro_4_23", 6): {"mg": "Ohatrinona?", "en": "How much are they?"},
    ("dlg_intro_4_23", 8): {"mg": "Omeo telo azafady.", "en": "Give me three, please."},

    ("dlg_intro_4_24", 0): {"mg": "Mandrosoa", "en": "Come and buy (invitation to approach)"},
    ("dlg_intro_4_24", 1): {"mg": "Ohatrinona ny vary?", "en": "How much is the rice?"},
    ("dlg_intro_4_24", 3): {"mg": "Omeo telo kapoaka azafady.", "en": "Give me three cups (of rice) please."},
    ("dlg_intro_4_24", 4): {"mg": "Azafady, tsy misy madinika.", "en": "Sorry, no change."},
    ("dlg_intro_4_24", 5): {"mg": "Mandrosoa", "en": "Come (and buy) - next customer"},

    ("dlg_intro_review_1_4_26", 0): {
        "mg": "Faly no anarany. Mpampianatra anglisy no asany. Manambady izy. Felana no anaran'ny vadiny. Mpivarotra no asany.",
        "en": "His name is Faly. His job is English teacher. He is married. His wife's name is Felana. Her job is merchant.",
    },
    ("dlg_intro_review_1_4_26", 1): {
        "mg": "Avy eto Antsirabe izy sy ny vadiny. Mbola tsy manana zanaka izy ireo. Mipetraka eto Antsirabe izy ireo.",
        "en": "He and his wife are from here in Antsirabe. They don't have children yet. They live here in Antsirabe.",
    },

    ("dlg_intro_5_27", 0): {"mg": "Mitsangàna", "en": "Stand up"},
    ("dlg_intro_5_27", 1): {"mg": "Hitsangana isika", "en": "Let us stand"},
    ("dlg_intro_5_27", 2): {"mg": "Mipetraha", "en": "Sit down"},
    ("dlg_intro_5_27", 3): {"mg": "Afaka mipetraka isika. Mahazoa toerana.", "en": "We can have a seat / you may take a seat"},
    ("dlg_intro_5_27", 4): {"mg": "Mihira", "en": "Sing"},
    ("dlg_intro_5_27", 5): {"mg": "Hihira isika", "en": "Let us sing"},
    ("dlg_intro_5_27", 6): {"mg": "Hamaky ny Tenin'Andriamanitra isika", "en": "We will read God's word together"},
    ("dlg_intro_5_27", 7): {"mg": "Hivavaka isika", "en": "Let us pray"},
    ("dlg_intro_5_27", 8): {"mg": "Andriamanitra ô, Amena.", "en": "O God, Amen."},

    ("dlg_intro_6_29", 1): {"mg": "ENY, TSARA SATRIA TSY BETSAKA NY FIARA", "en": "Yes, it was good because there weren't many vehicles"},
    ("dlg_intro_6_29", 5): {"mg": "TSY MISY TABATABA", "en": "There wasn't much noise"},

    ("dlg_theme_15e_0", 1): {"mg": "Tsia, fa handeha aiza ianao?", "en": "No, but where are you going?"},
    ("dlg_theme_15e_0", 6): {"mg": "Eny. Fa tsy sarotra.", "en": "Yes, but it is not difficult."},
    ("dlg_theme_15e_0", 8): {"mg": "Tsy misy fisaorana.", "en": "You are welcome."},

    ("dlg_theme_15e_1", 5): {"mg": "Eny. Manala olona sy entana izy.", "en": "Yes. It lets off passengers and goods."},
    ("dlg_theme_15e_1", 7): {"mg": "Tsy misy fisaorana.", "en": "You are welcome."},

    ("dlg_theme_15e_2", 6): {"mg": "Eny, eto. Ity ny volanao. Misaotra betsaka.", "en": "Yes, here. Here is the money. Thank you very much."},

    ("dlg_theme_15e_3", 0): {"mg": "Manao ahoana tompoko. Mbola misy toerana ve mandeha any Antsirabe?", "en": "Hello! Are there still seats for Antsirabe?"},
    ("dlg_theme_15e_3", 1): {"mg": "Manao ahoana tompoko. Handeha rahoviana?", "en": "Hello! When are you leaving?"},
    ("dlg_theme_15e_3", 5): {"mg": "Eny, mbola malalaka aorian'ny mpamily.", "en": "Yes, there is still space behind the driver."},
    ("dlg_theme_15e_3", 8): {"mg": "Tsy maninona. Mety. Ohatrinona ny saran-dàlana?", "en": "That is fine. All right. How much does the journey cost?"},
    ("dlg_theme_15e_3", 10): {"mg": "Eny, ataovy.", "en": "Yes, I will take them."},
}


def clean_vocab(vocabulary):
    """Filter out duplicate Tsimihety-only entries, rewrite Tsimihety words into
    Official Malagasy, and deduplicate any entries that now share the same word."""
    cleaned = []
    by_mg = {}

    # Pass 1: apply rewrites and drops
    intermediate = []
    for w in vocabulary:
        wid = w["id"]
        if wid in DROP_VOCAB_IDS:
            continue
        w = dict(w)
        w.pop("mg_tsm", None)
        w.pop("dialect", None)
        if wid in VOCAB_REWRITES:
            for k, v in VOCAB_REWRITES[wid].items():
                if v == "":
                    w.pop(k, None)
                else:
                    w[k] = v
        if wid in VOCAB_NOTE_REWRITES:
            w["note"] = VOCAB_NOTE_REWRITES[wid]
        if w.get("note") == "Tsimihety dialect form":
            w.pop("note", None)
        # Clean any leftover "(Tsimihety)" or "(tsm)" in English gloss
        en = w.get("en", "")
        en = re.sub(r"\s*\((?:also\s+)?(?:Tsimihety|tsm)[^)]*\)", "", en, flags=re.I).strip()
        en = re.sub(r"\s*\((?:Tsimihety|tsm)[^)]*$", "", en, flags=re.I).strip()
        w["en"] = en or w["en"]
        w["isPhrase"] = " " in w["mg"]
        intermediate.append(w)

    # Pass 2: deduplicate when a rewritten/stripped entry has the exact same
    # Malagasy word as a primary Official Malagasy entry, merging themes so no
    # lesson shelf loses vocabulary.
    # Prefer entries whose id is a clean primary word (not in VOCAB_REWRITES and no parens/tsm).
    def _is_secondary_id(wid):
        if wid == "eny_(visible)":
            return False
        low = wid.lower()
        return ("tsm" in low or "_/_" in wid or "(" in wid or ")" in wid or wid in VOCAB_REWRITES)

    intermediate.sort(key=lambda item: (1 if _is_secondary_id(item["id"]) else 0))
    for w in intermediate:
        key = re.sub(r"\s+", " ", w["mg"].strip().lower().rstrip("?!."))
        if key in by_mg and _is_secondary_id(w["id"]):
            primary = by_mg[key]
            existing_themes = list(primary.get("themes") or [])
            for t in (w.get("themes") or []):
                if t not in existing_themes:
                    existing_themes.append(t)
            primary["themes"] = existing_themes
            continue
        by_mg.setdefault(key, w)
        cleaned.append(w)
    return cleaned


def clean_phrases(phrases):
    out = []
    for p in phrases:
        pid = p["id"]
        if pid in DROP_PHRASE_IDS:
            continue
        p = dict(p)
        p.pop("mg_tsm", None)
        if pid in PHRASE_REWRITES:
            for k, v in PHRASE_REWRITES[pid].items():
                if v == "":
                    p.pop(k, None)
                else:
                    p[k] = v
        out.append(p)
    return out


def clean_dialogues(dialogues):
    out = []
    for d in dialogues:
        d = dict(d)
        new_lines = []
        for idx, line in enumerate(d.get("lines", [])):
            line = dict(line)
            line.pop("mg_tsm", None)
            override = DIALOGUE_LINE_REWRITES.get((d["id"], idx))
            if override:
                line["mg"] = override["mg"]
                if "en" in override:
                    line["en"] = override["en"]
            new_lines.append(line)
        d["lines"] = new_lines
        out.append(d)
    return out


# Word-level Tsimihety -> Official Malagasy replacements for grammar examples & rules
_GRAMMAR_TEXT_SUBS = [
    # Remove explicit "(off) / ... (tsm)" or "(tsm) / ... (off)" pairs
    (r"\b([A-Za-zÀ-ÿ'-]+(?:\s+[A-Za-zÀ-ÿ'-]+)?)\s*\(off(?:icial)?\)\s*/\s*[^/;.,)]+\s*\(tsm\)", r"\1"),
    (r"\b[^/;.,()]+\s*\(tsm\)\s*/\s*([A-Za-zÀ-ÿ'-]+(?:\s+[A-Za-zÀ-ÿ'-]+)?)\s*\(off(?:icial)?\)", r"\1"),
    (r"\s*\(off(?:icial)?\)", ""),
    (r"\s*\(tsm\)", ""),
    (r"\s*\[tsm\]", ""),
    (r"\(Tsimihety\s*/\s*Official\)", "(Official Malagasy)"),
    (r"In the Tsimihety dialect,\s*", "In Malagasy, "),
    (r"Tsimihety uses different suffixes as it is a dialect\.", ""),
    # Specific sentence/example replacements in grammar
    ("Manakory ny rivotra ?", "Manao ahoana ny rivotra ?"),
    ("Manakory izy ?", "Manao ahoana izy ?"),
    ("MANAHOANA/MANAKORY", "MANAHOANA"),
    ("INONA/INO", "INONA"),
    ("IZA/ZOVY", "IZA"),
    ("VE/MOA", "VE"),
    ("Miasa zaho (aho)", "Miasa aho"),
    ("Miasa anao (ianao)", "Miasa ianao"),
    ("Miasa antsika (isika)", "Miasa isika"),
    ("Miasa zahay (izahay)", "Miasa izahay"),
    ("Miasa areo (ianareo)", "Miasa ianareo"),
    ("Miasa zareo (izy ireo)", "Miasa izy ireo"),
    ("Nisoma zahay", "Nilalao izahay"),
    ("Tsy nianatra ny gaomadiniky", "Tsy nianatra ny ankizy"),
    ("ny gaomadiniky", "ny ankizy"),
    ("Nividy akoho sy legioma zaho — Manino (i)anao? – Nividy akoho sy legioma",
     "Nividy akoho sy legioma aho — Naninona ianao? – Nividy akoho sy legioma"),
    ("Zôvy nividy akoho sy legioma? – Zaho", "Iza no nividy akoho sy legioma? – Izaho"),
    ("Iza no niantso an'i Soa? – Zaho", "Iza no niantso an'i Soa? – Izaho"),
    ("Nividy akoho sy legioma ve anao? – Ia", "Nividy akoho sy legioma ve ianao? – Eny"),
    ("Nividy ino anao? – Akoho sy legioma", "Nividy inona ianao? – Akoho sy legioma"),
    ("Migiaka kafe loatra izy", "Misotro kafe loatra izy"),
    ("Miasa malaky izy", "Miasa haingana izy"),
    ("Manjary mody ve zaho azafady?", "Mahazo mody ve aho azafady?"),
    ("MAHAZO/MANJARY", "MAHAZO"),
    ("(Tsm) Samby MAMY ny fontsy ndreky tsoà", "Samy MAMY ny akondro sy ny fary"),
    ("Both the bananas and the sugarcane are sweet (Tsimihety)", "Both the bananas and the sugarcane are sweet"),
    ("SAMY (official) / SAMBY (Tsimihety)", "SAMY"),
    ("SAMY/SAMBY", "SAMY"),
    ("manintsy → manintsinintsy", "mangatsiaka → mangatsiatsiaka"),
    ("manintsy (cold) → manintsinintsy (colder)", "mangatsiaka (cold) → mangatsiatsiaka (cooler)"),
    ("I Kanada manintsinintsy tsitoko I Suisse", "Mangatsiaka kokoa i Kanada noho i Suisse"),
    ("Ny hena omby matsirotsiro tsitoko ny akoho", "Matsiro kokoa ny henan'omby noho ny akoho"),
    ("Ny infirmiera miasaasa tsitoko ny dokotera", "Miasa bebe kokoa ny mpitsabo mpanampy noho ny dokotera"),
    ("Ny masôva mazavazava tsitoko ny davôlagna", "Mazava kokoa ny masoandro noho ny volana"),
    ("Ny fontsy mamimamy tsitoko ny paoma", "Mamy kokoa ny akondro noho ny paoma"),
    ("ho an'iza/ho anjôvy", "ho an'iza"),
    ("ho an'iza / ho anjôvy", "ho an'iza"),
    ("amin'iza / aminjôvy", "amin'iza"),
    ("Amin'iza/aminjôvy", "Amin'iza"),
    ("Ny maso (eye/eyes) + zaho (tsm, I) → Ny masoKO (my eye / my eyes)",
     "Ny maso (eye/eyes) + aho (I) → Ny masoKO (my eye / my eyes)"),
    ("Latabatra + ANTSIKA (we incl.) → LatabaTRATSIKA", "Latabatra + ISIKA (we incl.) → LatabaTSIKA"),
    ("Penina + IZY (he/she) → PeninANAZY", "Penina + IZY (he/she) → PeniNY"),
    ("Satroka / satroko + ZAHO (I) → SatroKOANAHY", "Satroka + AHO (I) → SatroKO"),
    ("Môfonjôvy tôho? / MofoN'IZA ity?", "Mofon'iza ity?"),
    ("TSY aketo zareo", "TSY eto izy ireo"),
    ("Aketo amin'ny lôpitaly mô are(o)?", "Eto amin'ny hopitaly ve ianareo?"),
    ("TSY avy aketo zaho.", "TSY avy eto aho."),
    ("Niandry anao tany an-trano zaho.", "Niandry anao tany an-trano aho."),
    ("Mangatsiaka / Manintsy eto Frantsa. AIZA no mangatsiaka? / AIZA manintsy?",
     "Mangatsiaka eto Frantsa. AIZA no mangatsiaka?"),
    ("Andamosin'ny boaty ny akohovavy. / Afaran'ny boaty ny akohovavy.",
     "Ao aorian'ny boaty ny akohovavy."),
    ("Afaran'ny kakazo ny ankizy.", "Ao aorian'ny hazo ny ankizy."),
    ("Alôhaka ny ankizy ny kakazo.", "Eo alohan'ny ankizy ny hazo."),
    ("AIZA ny ankizy? — Afaran'ny kakazo.", "AIZA ny ankizy? — Ao aorian'ny hazo."),
    ("AIZA ny kakazo? — Alôhaka ny ankizy.", "AIZA ny kakazo? — Eo alohan'ny ankizy."),
    ("ZÔVY afaran'ny kakazo? — ny ankizy", "IZA no ao aorian'ny hazo? — ny ankizy"),
    ("INO alôhaka ny ankizy? — ny kakazo", "INONA no eo alohan'ny ankizy? — ny hazo"),
    ("Afaran'ny ankizy VE ny kakazo? — Ehe, alôhaka.", "Ao aorian'ny ankizy VE ny hazo? — Tsia, eo aloha."),
    ("Niasa izy nomoaligny.", "Niasa izy omaly."),
    ("Tafiriagna izy niasa?", "Oviana no niasa izy?"),
    ("Tsy hiasa zaho amin'ny volana Desambra.", "Tsy hiasa aho amin'ny volana Desambra."),
    ("Isaka ino homagna vary izy? — Isan'andro.", "Isaky ny inona no mihinana vary izy? — Isan'andro."),
    ("Amin'ny firy izy mionjogno? — Amin'ny 6.", "Amin'ny firy no mifoha izy? — Amin'ny 6."),
    ("Tamin'ny firy izy nandry? — Tamin'ny 10 sy sasany.", "Tamin'ny firy no natory izy? — Tamin'ny 10 sy sasany."),
    ("Homagna maraindraigny zahay amin'ny 6.", "Misakafo maraina izahay amin'ny 6."),
    ("Homagna matsagna zahay amin'ny 12.", "Misakafo atoandro izahay amin'ny 12."),
    ("Homagna amin'ny aligny izahay amin'ny 7.", "Misakafo hariva izahay amin'ny 7."),
    ("Nora ny manga / Mora ny manga", "Mora ny manga"),
    # Complete remaining grammar explanations, rules, and examples
    ("Use MANAHOANA ny…? / MANAKORY ny…?", "Use MANAO AHOANA ny…?"),
    ("Use INONA no…? / INO…?", "Use INONA no…?"),
    ("Use IZA no…? / ZOVY…?", "Use IZA no…?"),
    ("Zovy ravoravo ?", "Iza no ravoravo ?"),
    ("The particle VE or MOA poses a yes/no question", "The particle VE poses a yes/no question"),
    ("…Ve…? / …Moa…? — answered with 'Ia, …' (yes) or 'Ehe, tsy…' (no).",
     "…Ve…? — answered with 'Eny, …' (yes) or 'Tsia, tsy…' (no)."),
    ("Ravoravo moa izy ?", "Ravoravo ve izy ?"),
    ("– Ia (Is he happy? – Yes)", "– Eny (Is he happy? – Yes)"),
    ("– Ehe (Is the air clean? – Yes)", "– Tsia (Is the air clean? – No)"),
    ("Same verb form with every subject pronoun (official Malagasy in parentheses).",
     "Same verb form with every subject pronoun."),
    ("Forming questions with Manino / Zovy / Ino / Ve",
     "Forming questions with Maninona / Iza no / Inona no / Ve"),
    ("Manino (Maninona, official) = What are we doing?; Zovy (iza no) = Who is?; Ino (inona no) = What is?; Ve = Is it / Do…?",
     "Maninona = What are they doing?; Iza no = Who is?; Inona no = What is?; Ve = Is it / Do…?"),
    ("Miasa ny vitsika — Manino ny vitsika ? – miasa", "Miasa ny vitsika — Maninona ny vitsika ? – miasa"),
    ("Ino miasa ? – ny vitsika", "Inona no miasa ? – ny vitsika"),
    ("Miasa ve ny vitsika ? – Ia, miasa izy", "Miasa ve ny vitsika ? – Eny, miasa izy"),
    ("Niasa izy — Nanino ny vitsika ? – niasa", "Niasa izy — Naninona ny vitsika ? – niasa"),
    ("Zovy niasa ? – izy", "Iza no niasa ? – izy"),
    ("Niasa ve izy ? – Ia, niasa izy", "Niasa ve izy ? – Eny, niasa izy"),
    ("Hiasa i Soa — Hanino i Soa ? – hiasa", "Hiasa i Soa — Haninona i Soa ? – hiasa"),
    ("Zovy hiasa ? – i Soa", "Iza no hiasa ? – i Soa"),
    ("Hiasa ve I Soa ? – Ia, hiasa", "Hiasa ve i Soa ? – Eny, hiasa"),
    ("Three question types: Manino / Zovy / Ve (= moa)",
     "Three question types: Maninona / Iza no / Ve"),
    ("With Ve, the answer is always Ia (yes) or Ehe (no).",
     "With Ve, the answer is Eny (yes) or Tsia (no)."),
    ("Q: MANINO (Maninona, off) ny ankizy? A: misoma", "Q: MANINONA ny ankizy? A: milalao"),
    ("Q: ZOVY (Iza no) misoma? A: ny ankizy", "Q: IZA NO milalao? A: ny ankizy"),
    ("Q: Misoma VE / MOA ny ankizy? A: Ia, misoma (ehe, tsy misoma)",
     "Q: Milalao VE ny ankizy? A: Eny, milalao (tsia, tsy milalao)"),
    ("aho/aho (I); ianao (you); izy (he/she); antsika/isika (we incl.); izahay/izahay (we excl.); areo/ianareo (you pl.); izy ireo/izy ireo (they)",
     "aho (I); ianao (you); izy (he/she); isika (we incl.); izahay (we excl.); ianareo (you pl.); izy ireo (they)"),
    ("Subject pronouns: aho/aho (I), ianao/ana(o) (you), izy (he/she), isika/antsika (we incl.), izahay/izahay (we excl.), ianareo/are(o) (you pl.), izy ireo/izy ireo (they), I Soa.",
     "Subject pronouns: aho (I), ianao (you), izy (he/she), isika (we incl.), izahay (we excl.), ianareo (you pl.), izy ireo (they), i Soa."),
    ("1. Maninona/Manino: What are…doing? (past: Naninona/Nanino; future: Haninona/Hanino). 2. Iza no/Zôvy: Who…? 3. An'iza/Zôvy: Who(m) is the action directed to? 4. Inona/Ino: What…? Note: Ve/Moa turns a sentence into a question, like 'isn't it?' or 'right?'.",
     "1. Maninona: What are…doing? (past: Naninona; future: Haninona). 2. Iza no: Who…? 3. An'iza: Who(m) is the action directed to? 4. Inona: What…? Note: Ve turns a sentence into a yes/no question."),
    ("Present: amin'ny ino? / amin'ny inona?. Past: tamin'ny ino? / tamin'ny inona?.",
     "Present: amin'ny inona?. Past: tamin'ny inona?."),
    ("Migiaka rano amin'ny tavoahangy izy. — Maninona izy? – Migiaka rano",
     "Misotro rano amin'ny tavoahangy izy. — Maninona izy? – Misotro rano"),
    ("Migiaka inona izy? – Rano", "Misotro inona izy? – Rano"),
    ("Zovy migiaka rano? – Izy", "Iza no misotro rano? – Izy"),
    ("Migiaka dite moa izy? – Tsia, rano", "Misotro dite ve izy? – Tsia, rano"),
    ("Migiaka rano amin'ny inona izy? – Amin'ny tavoahangy",
     "Misotro rano amin'ny inona izy? – Amin'ny tavoahangy"),
    ("Near: ity / ireto, tôho / ireto. Intermediate: io / ireo (both). Farther: itsy / iretsy, rôho / rôho. Farther still: irý / irerý, rôho / rôho. Very far: iny / ireny (both, off and tsm).",
     "Near: ity / ireto. Intermediate: io / ireo. Farther: itsy / iretsy. Farther still: irý / irerý. Very far: iny / ireny."),
    ("Iza iny? (Zôvy iny?) → Fara iny", "Iza iny? → Fara iny"),
    ("Inona irery? (Ino irery?) → Gisa ireo", "Inona irery? → Gisa ireo"),
    ("Inona ity? (Ino rôho?) → Boky iny", "Inona ity? → Boky iny"),
    ("B - Both: SAMY / SAMBY (Tsimihety)", "B - Both: SAMY"),
    ("Comparisons (III) — Duplicative, Comparative (Tsimihety) and Superlative",
     "Comparisons (III) — Duplicative, Comparative and Superlative"),
    ("However, comparatives in the Tsimihety dialect don't always follow the same change in meaning that the duplication would suggest.", ""),
    ("B – The Comparative (Tsimihety dialect) with tsitoko",
     "B – The Comparative with KOKOA ... NOHO"),
    ("Structure: Subject + Duplicative Predicate + tsitoko (more than) + Comparative noun.",
     "Structure: Predicate + kokoa + Subject + noho + Comparative noun."),
    ("Bananas are sweeter than apples (table: Subject = ny fontsy (bananas), Predicate = mamimamy (sweeter), Comparator = tsitoko (more than), Comparison term = ny paoma (apples))",
     "Bananas are sweeter than apples"),
    ("manintsy indrindra I Rosia", "Mangatsiaka indrindra i Rosia"),
    ("manintsy indrindra amin'ny firenena rehetra i Rosia",
     "Mangatsiaka indrindra amin'ny firenena rehetra i Rosia"),
    ("Faran'ny manintsy i Rosia", "Faran'ny mangatsiaka i Rosia"),
    ("Ho an'iza? / Ho anjôvy? = For whom?", "Ho an'iza? = For whom?"),
    ("aho (I) → ho ahy; anao (you sg) → ho anao; izy (he/she) → ho azy; antsika (we incl.) → ho antsika; izahay (we excl.) → ho anay; areo (you pl.) → ho anareo;",
     "aho (I) → ho ahy; ianao (you sg) → ho anao; izy (he/she) → ho azy; isika (we incl.) → ho antsika; izahay (we excl.) → ho anay; ianareo (you pl.) → ho anareo;"),
    ("Aho/Izaho (I): AMIKO (off present) / TAMIKO (off past) / AMINAHY (tsm present) / TAMINAHY (tsm past). Ianao/Anao (you sg.): AMINAO/TAMINAO, AMINA(O)/TAMINA(O). Izy (he/she): AMINY/TAMINY, AMINAZY/TAMINAZY. Isika/Antsika (we incl.): AMINTSIKA/TAMINTSIKA (both). Izahay/Izahay (we excl.): AMINAY/TAMINAY (both). Ianareo/Areo (you pl.): AMINAREO/TAMINAREO, AMINARE(O)/TAMINARE(O). Izy ireo/Izy ireo (they): AMIN'IZY IREO/TAMIN'IZY IREO, AMINJARE(O)/TAMINJARE(O). I Lita: AMIN'I LITA/TAMIN'I LITA (both forms). Ny dokotera: AMIN'NY DOKOTERA/TAMIN'NY DOKOTERA (both forms).",
     "Aho/Izaho (I): AMIKO (present) / TAMIKO (past). Ianao (you sg.): AMINAO / TAMINAO. Izy (he/she): AMINY / TAMINY. Isika (we incl.): AMINTSIKA / TAMINTSIKA. Izahay (we excl.): AMINAY / TAMINAY. Ianareo (you pl.): AMINAREO / TAMINAREO. Izy ireo (they): AMIN'IZY IREO / TAMIN'IZY IREO. I Lita: AMIN'I LITA / TAMIN'I LITA. Ny dokotera: AMIN'NY DOKOTERA / TAMIN'NY DOKOTERA."),
    ("Amin'iza? / Aminjôvy? = To whom? With whom? From whom? Past: Tamin'iza? / Taminjôvy?.",
     "Amin'iza? = To whom? With whom? From whom? Past: Tamin'iza?."),
    ("Aho/aho 'I': masoKO = my eye; tànaKO = my hand; mpianatrO = my student; satrokO = my hat. Ianao/ana(o) 'you (sg.)': masoNAO / masoNĀ(o); tànaNAO / tànagnNĀ(O); mpianatrAO / mpianatrĀ(O); satrokAO / satrokA(o). Izy 'he/she': masoNY / masoANAZY; tànaNY / tànagnANAZY; mpianaNY / mpianatrANAZY; satroNY / satrokOANAZY. Isika/antsika 'we (incl.)': masoNTSIKA / masoANTSIKA; tànaNTSIKA / tànagnANTSIKA; mpianaTSIKA / mpianatrANTSIKA; satroTSIKA / satrokoANTSIKA. Izahay/izahay 'we (excl.)': masoNAY / masoANAY; tànaNAY / tànagnANAY; mpianatrAY / mpianatrANAY; satrokAY / satrokoAY. Ianareo/are(o) 'you (pl.)': masoNAREO / masoNARE(o); tànaNAREO / tànagnARE(o); mpianatrAREO / mpianatrARE(O); satrokAREO / satrokARE(O). Izy ireo/zare(o) 'they': masoN'IZY IREO / masoNJARE(o); tànaN'IZY IREO / tànagnNJARE(o); mpianatr'IZY IREO / mpianatraZARE(o); satrok'IZY IREO / satrokoZAREO. I Soa: masoN'i Soa / tànaN'i Soa; mpianatr'i Soa / mpianatraSOA = Soa's students; satrok'i Soa / satrokoSOA = the hat of Soa. Ny dokotera 'the doctor': masoN'NY DOKOTERA / tànaN'NY DOKOTERA; mpianatrY NY DOKOTERA; satrokY NY DOKOTERA.",
     "Aho 'I': masoKO = my eye; tànaKO = my hand; mpianatrO = my student; satrokO = my hat. Ianao 'you (sg.)': masoNAO; tànaNAO; mpianatrAO; satrokAO. Izy 'he/she': masoNY; tànaNY; mpianaNY; satroNY. Isika 'we (incl.)': masoNTSIKA; tànaNTSIKA; mpianaTSIKA; satroTSIKA. Izahay 'we (excl.)': masoNAY; tànaNAY; mpianatrAY; satrokAY. Ianareo 'you (pl.)': masoNAREO; tànaNAREO; mpianatrAREO; satrokAREO. Izy ireo 'they': masoN'IZY IREO; tànaN'IZY IREO; mpianatr'IZY IREO; satrok'IZY IREO. I Soa: masoN'i Soa; tànaN'i Soa; mpianatr'i Soa = Soa's students; satrok'i Soa = Soa's hat. Ny dokotera: masoN'NY DOKOTERA; tànaN'NY DOKOTERA; mpianatrY NY DOKOTERA; satrokY NY DOKOTERA."),
    ("-IZA = WHOSE, suffixed to the noun: NOUN + IZA? / NOUN + ZÔVY?.",
     "-IZA = WHOSE, suffixed to the noun: NOUN + IZA?."),
    ("Aho/aho: AHY = 'mine'. Ianao/ana(o): ANAO / NIHINĀ(O) = 'yours'. Izy: AZY / NIHINAZY = 'his/hers'. Isika/antsika: ANTSIKA / NIHINTSIKA = 'ours' (incl.). Izahay/izahay: ANAY / NIHINAY = 'ours' (excl.). Ianareo/are(o): ANAREO / NIHINARE(O) = 'yours' (pl.). Izy ireo/izy ireo: AZY IREO / NIHINJARE(O) = 'theirs'. I Soa: AN'I SOA / NIHIN'I SOA = 'Soa's'. Ny dokotera: AN'NY DOKOTERA / NIHIN'NY DOKOTERA = 'the doctor's'.",
     "Aho: AHY = 'mine'. Ianao: ANAO = 'yours'. Izy: AZY = 'his/hers'. Isika: ANTSIKA = 'ours' (incl.). Izahay: ANAY = 'ours' (excl.). Ianareo: ANAREO = 'yours' (pl.). Izy ireo: AN'IZY IREO = 'theirs'. I Soa: AN'I SOA = 'Soa's'. Ny dokotera: AN'NY DOKOTERA = 'the doctor's'."),
    ("Questions: An'iza …? / Nihinjôvy …?", "Questions: An'iza …?"),
    ("Ask and answer as in the example: AN'IZA ny mofo? → ahy. NIHINJÔVY ny môfo? → Nihinahy. (Whose bread is this? — It's mine.) MOFO / aho (bread / I).",
     "Ask and answer as in the example: AN'IZA ny mofo? → Ahy. (Whose bread is this? — It's mine.) MOFO / aho (bread / I)."),
    ("etsy/erȳ / arôho, ao, atsy/arȳ / arôho", "etsy/erý, ao, atsy/arý"),
    ("Eto (aketo) amin'ny banky", "Eto amin'ny banky"),
    ("Tany (takany) amin'ny Hôpitaly", "Tany amin'ny hopitaly"),
    ("Ao (akao) amin'ny bazary", "Ao amin'ny bazary"),
    ("Tany (tarôho) amin'ny fiangonana Loteriana", "Tany amin'ny fiangonana Loteriana"),
    ("Hôpitaly", "Hopitaly"),
    ("hôpita", "hopita"),
    ("TSY = negation; Mô = ve (question particle, 'is it…? / are…?').",
     "TSY = negation; VE = question particle ('is it…? / are…?')."),
    ("— AIZA ny …? (where is / where are …?); — INONA no …? / INO …? (what is / what are …?); — IZA no …? / ZÔVY …? (who is / who are …?); — … VE …? (is / are / do …?).",
     "— AIZA ny …? (where is / where are …?); — INONA no …? (what is / what are …?); — IZA no …? (who is / who are …?); — … VE …? (is / are / do …?)."),
    ("AIZA ny kakazo? — Eo alohan'ny ankizy.", "AIZA ny hazo? — Eo alohan'ny ankizy."),
    ("(The source also lists Tsimihety forms nomoaligny = yesterday, niagny = today, amaraigny = tomorrow, afaka nomoaligny, afaka amaraigny.)", ""),
    ("Past: Oviana no …? / Tafiriagna …?. Future: Rahoviana no …? / Hafiriagna …?.",
     "Past: Oviana no …?. Future: Rahoviana no …?."),
    ("Week (herinandro off / vôlagna-related tsm): past = tamin'ny herinandro lasa; present = amin'ity herinandro ity; future = amin'ny herinandro ho avy / amin'ny herinandro io / rôho. Month (volana off / vôlagna tsm): past = tamin'ny volana lasa / tamin'ny vôlagna teo igny; present = amin'ity volana ity / amin'ny vôlagna tôho; future = amin'ny volana ho avy / amin'ny vôlagna io / rôho. Year (taona off / taogno tsm): past = tamin'ny taona lasa / tamin'ny taogno teo igny; present = amin'ity taona ity / amin'ny taogno tôho; future = amin'ny taona ho avy / amin'ny taogno io / rôho.",
     "Week (herinandro): past = tamin'ny herinandro lasa; present = amin'ity herinandro ity; future = amin'ny herinandro ho avy. Month (volana): past = tamin'ny volana lasa; present = amin'ity volana ity; future = amin'ny volana ho avy. Year (taona): past = tamin'ny taona lasa; present = amin'ity taona ity; future = amin'ny taona ho avy."),
    ("Question: Isaky ny inona no …? / Isaka ino …? — 'How often…?'.",
     "Question: Isaky ny inona no …? — 'How often…?'. "),
    ("isan'andro (both) = every day", "isan'andro = every day"),
    ("Homagna maraindraigny = to have breakfast (lit. to eat in the morning); homagna matsagna = to have lunch (lit. to eat at midday); homagna amin'ny aligny = to have dinner (lit. to eat at night).",
     "Misakafo maraina = to have breakfast; misakafo atoandro = to have lunch; misakafo hariva / alina = to have dinner."),
    ("Two-syllable words with M-: past N- / — (nora, tsm), present M- (mora), future Ho- (ho mora).",
     "Two-syllable words with M-: past M- (mora), present M- (mora), future Ho- (ho mora)."),
    # Whole-word pronoun fixes in examples
    (r"\bzaho\b", "aho"),
    (r"\bZaho\b", "Izaho"),
    (r"\bZAHO\b", "AHO"),
    (r"\bzahay\b", "izahay"),
    (r"\bZahay\b", "Izahay"),
    (r"\bZAHAY\b", "IZAHAY"),
    (r"\bzareo\b", "izy ireo"),
    (r"\bZareo\b", "Izy ireo"),
    ("Tsimihety uses different suffixes as it is a dialect.", ""),
    ("In the Tsimihety dialect, comparison", "In Malagasy, comparison"),
    ("aho/aho (I); ianao (you); izy (he/she); antsika/isika (we incl.); izahay/izahay (we excl.); areo/ianareo (you pl.); izy ireo/izy ireo (they)",
     "aho (I); ianao (you); izy (he/she); isika (we incl.); izahay (we excl.); ianareo (you pl.); izy ireo (they)"),
    ("areo (you pl.) → ho anareo;", "ianareo (you pl.) → ho anareo;"),
    ("Aho/Izaho (I): AMIKO (off present) / TAMIKO (off past) / AMINAHY (tsm present) / TAMINAHY (tsm past). Ianao/Anao (you sg.): AMINAO/TAMINAO, AMINA(O)/TAMINA(O). Izy (he/she): AMINY/TAMINY, AMINAZY/TAMINAZY. Isika/Antsika (we incl.): AMINTSIKA/TAMINTSIKA (both). Izahay/Izahay (we excl.): AMINAY/TAMINAY (both). Ianareo/Areo (you pl.): AMINAREO/TAMINAREO, AMINARE(O)/TAMINARE(O). Izy ireo/Izy ireo (they): AMIN'IZY IREO/TAMIN'IZY IREO, AMINJARE(O)/TAMINJARE(O). I Lita: AMIN'I LITA/TAMIN'I LITA (both forms). Ny dokotera: AMIN'NY DOKOTERA/TAMIN'NY DOKOTERA (both forms).",
     "Aho/Izaho (I): AMIKO (present) / TAMIKO (past). Ianao (you sg.): AMINAO / TAMINAO. Izy (he/she): AMINY / TAMINY. Isika (we incl.): AMINTSIKA / TAMINTSIKA. Izahay (we excl.): AMINAY / TAMINAY. Ianareo (you pl.): AMINAREO / TAMINAREO. Izy ireo (they): AMIN'IZY IREO / TAMIN'IZY IREO. I Lita: AMIN'I LITA / TAMIN'I LITA. Ny dokotera: AMIN'NY DOKOTERA / TAMIN'NY DOKOTERA."),
]


def _clean_grammar_str(text):
    if not text:
        return text
    out = text
    for pat, repl in _GRAMMAR_TEXT_SUBS:
        if pat.startswith("\\b") or pat.startswith("\\s") or "(" in pat and "\\" in pat:
            out = re.sub(pat, repl, out)
        else:
            out = out.replace(pat, repl)
    out = re.sub(r"\s{2,}", " ", out).strip()
    return out


def clean_grammar(grammar):
    out = []
    for g in grammar:
        g = dict(g)
        g["title"] = _clean_grammar_str(g.get("title", ""))
        rules = []
        for r in g.get("rules", []):
            r = dict(r)
            r["rule"] = _clean_grammar_str(r.get("rule", ""))
            r["explanation"] = _clean_grammar_str(r.get("explanation", ""))
            examples = []
            for ex in r.get("examples", []):
                ex = dict(ex)
                ex["mg"] = _clean_grammar_str(ex.get("mg", ""))
                ex["en"] = _clean_grammar_str(ex.get("en", ""))
                examples.append(ex)
            r["examples"] = examples
            rules.append(r)
        g["rules"] = rules
        out.append(g)
    return out


def clean_culture(culture):
    out = []
    for c in culture:
        note = c.get("note", "")
        low = note.lower()
        # Drop pure Tsimihety/regional dialect/extraction notes
        if ("in tsimihety, sometimes the 'n' consonant" in low
                or "the dialect spoken in the region is called tsimihety" in low
                or "exercise b answers - contexts of use" in low
                or "text gap: in the extracted text" in low
                or "manakory e! akory lahaly" in low
                or "akory koahy! finaritra" in low):
            continue
        note = note.replace(
            "Other ways of saying hello in Madagascar vary by region: 'Manao ahoana' (Central, e.g. Tana), 'Salama' (North/Central), 'Akory' (East/South)",
            "Standard ways of saying hello in Official Malagasy: 'Manao ahoana' and 'Salama' (or politely 'Manao ahoana tompoko' / 'Salama tompoko')."
        )
        note = note.replace("'in vaovao'", "'Inona ny vaovao?'")
        note = note.replace("(lehilahy/lalahy)", "(lehilahy)")
        note = note.replace("(vehivavy/vaiavy)", "(vehivavy)")
        note = note.replace("'Veloma e! Mazotoa homana'", "'Veloma e! Mazotoa mihinana'")
        note = note.replace("'Veloma e, Harivariva koa'", "'Veloma e, Hariva koa'")
        note = note.replace("'Amaraigny koa'", "'Veloma rahampitso koa'")
        note = note.replace("'Veloma e. Tinainy koa'", "'Veloma e. Alatsinainy koa'")
        note = note.replace("'Tsisy fisaorana'", "'Tsy misy fisaorana'")
        note = note.replace("tsisy fisaorana", "tsy misy fisaorana")
        note = note.replace("(ZAGNAHARY / ANDRIAMANITRA)", "(ZANAHARY / ANDRIAMANITRA)")
        note = note.replace("and Tsimihety is even more complicated than official Malagasy.",
                            "depending on the speaker's and relative's gender and relative age.")
        note = note.replace("In Tsimihety, 'montre' (French loanword) is the only word used for watch/clock.",
                            "In everyday speech, 'montre' (from French) is also heard.")
        note = note.replace("aho/zaho", "aho")
        note = re.sub(r"\s*\(off(?:icial)?\)\s*/\s*[^-;,.)]+\s*\(tsm\)", "", note)
        note = re.sub(r"\s*=\s*'[^']+'\s*\(tsm\)", "", note)
        note = re.sub(r"\s*\((?:off|official|tsm)\)", "", note)
        note = re.sub(r"\s{2,}", " ", note).strip()
        c = dict(c)
        c["note"] = note
        out.append(c)
    return out
