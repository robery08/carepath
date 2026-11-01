export type GuideLanguage = "en" | "kn";

export type GuideSource = { label: string; url: string };
export type GuideMedicine = {
  name: string;
  helps: Record<GuideLanguage, string>;
  cautions: Record<GuideLanguage, string>;
  source: GuideSource;
};
export type SymptomGuideTopic = {
  id: string;
  name: Record<GuideLanguage, string>;
  aliases: string[];
  intro: Record<GuideLanguage, string>;
  selfCare: Record<GuideLanguage, string[]>;
  medicineNote?: Record<GuideLanguage, string>;
  medicines?: GuideMedicine[];
  urgent: Record<GuideLanguage, string[]>;
  followUp: Record<GuideLanguage, string>;
  sources: GuideSource[];
};

export const SYMPTOM_GUIDES: SymptomGuideTopic[] = [
  {
    id: "fever",
    name: { en: "Fever", kn: "ಜ್ವರ" },
    aliases: ["fever", "fevers", "feever", "feaver", "temperature", "high temperature", "hot body", "feeling feverish", "ಜ್ವರ"],
    intro: {
      en: "Fever is a sign, not a diagnosis. Many different illnesses can cause it, so this guide cannot tell you the cause.",
      kn: "ಜ್ವರ ಒಂದು ಲಕ್ಷಣ; ರೋಗನಿರ್ಣಯವಲ್ಲ. ಹಲವು ಕಾರಣಗಳಿಂದ ಜ್ವರ ಬರಬಹುದು; ಈ ಮಾರ್ಗದರ್ಶಿ ಕಾರಣವನ್ನು ಪತ್ತೆಹಚ್ಚುವುದಿಲ್ಲ.",
    },
    selfCare: {
      en: ["Rest and drink fluids if you are awake and able to swallow. Keep a note of the temperature, when it began, and any new symptoms.", "If the person is a young child, pregnant, receiving cancer treatment, has a weakened immune system, or has a serious long-term condition, contact a healthcare professional early."],
      kn: ["ಎಚ್ಚರದಲ್ಲಿದ್ದು ನುಂಗಲು ಸಾಧ್ಯವಿದ್ದರೆ ವಿಶ್ರಾಂತಿ ಮಾಡಿ ದ್ರವಗಳನ್ನು ಕುಡಿಯಿರಿ. ತಾಪಮಾನ, ಜ್ವರ ಆರಂಭವಾದ ಸಮಯ ಮತ್ತು ಹೊಸ ಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿ.", "ಚಿಕ್ಕ ಮಗು, ಗರ್ಭಿಣಿ, ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ ಪಡೆಯುತ್ತಿರುವವರು, ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ಕಡಿಮೆ ಇರುವವರು ಅಥವಾ ಗಂಭೀರ ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆ ಇರುವವರಾದರೆ ವೈದ್ಯಕೀಯ ವೃತ್ತಿಪರರನ್ನು ಬೇಗ ಸಂಪರ್ಕಿಸಿ."],
    },
    medicineNote: {
      en: "These are common active ingredients people may see on labels. They are information examples, not a recommendation for you to take either one.",
      kn: "ಲೇಬಲ್‌ನಲ್ಲಿ ಕಾಣಬಹುದಾದ ಸಾಮಾನ್ಯ ಸಕ್ರಿಯ ಔಷಧಿ ಪದಾರ್ಥಗಳಿವು. ಇದು ಮಾಹಿತಿ ಮಾತ್ರ; ನೀವು ತೆಗೆದುಕೊಳ್ಳಬೇಕೆಂಬ ಶಿಫಾರಸು ಅಲ್ಲ.",
    },
    medicines: [
      {
        name: "Paracetamol (acetaminophen)",
        helps: { en: "Used to reduce fever and relieve mild to moderate pain. Brand names and forms differ by country.", kn: "ಜ್ವರ ಕಡಿಮೆ ಮಾಡಲು ಮತ್ತು ಸೌಮ್ಯದಿಂದ ಮಧ್ಯಮ ನೋವು ನಿವಾರಣೆಗೆ ಬಳಸುತ್ತಾರೆ. ಬ್ರ್ಯಾಂಡ್ ಮತ್ತು ರೂಪ ದೇಶದಂತೆ ಬದಲಾಗುತ್ತವೆ." },
        cautions: { en: "Taking too much, or accidentally combining several cold/flu products that contain it, can seriously harm the liver. Check every active ingredient and the local leaflet; ask a pharmacist first if the person is a child, pregnant, has liver disease, or takes other medicines.", kn: "ಅತಿಯಾಗಿ ತೆಗೆದುಕೊಳ್ಳುವುದು ಅಥವಾ ಇದೇ ಪದಾರ್ಥ ಇರುವ ಹಲವು ಶೀತ/ಫ್ಲೂ ಔಷಧಿಗಳನ್ನು ಜೊತೆಗೆ ತೆಗೆದುಕೊಳ್ಳುವುದರಿಂದ ಯಕೃತ್ತಿಗೆ ಗಂಭೀರ ಹಾನಿಯಾಗಬಹುದು. ಪ್ರತಿ ಸಕ್ರಿಯ ಪದಾರ್ಥ ಮತ್ತು ಸ್ಥಳೀಯ ಲೀಫ್ಲೆಟ್ ಪರಿಶೀಲಿಸಿ; ಮಗು, ಗರ್ಭಿಣಿ, ಯಕೃತ್ತಿನ ಕಾಯಿಲೆ ಅಥವಾ ಇತರ ಔಷಧಿಗಳಿದ್ದರೆ ಫಾರ್ಮಸಿಸ್ಟ್‌ನ್ನು ಮೊದಲು ಕೇಳಿ." },
        source: { label: "NIH MedlinePlus · Acetaminophen", url: "https://medlineplus.gov/druginfo/meds/a681004.html" },
      },
      {
        name: "Ibuprofen (an NSAID)",
        helps: { en: "A medicine ingredient used for pain, inflammation, and fever in some products; it is not suitable for everyone.", kn: "ಕೆಲವು ಔಷಧಿಗಳಲ್ಲಿ ನೋವು, ಉರಿಯೂತ ಮತ್ತು ಜ್ವರಕ್ಕೆ ಬಳಸುವ ಪದಾರ್ಥ; ಇದು ಎಲ್ಲರಿಗೂ ಸೂಕ್ತವಲ್ಲ." },
        cautions: { en: "It can cause stomach ulcers or bleeding and may affect the kidneys. If dengue is suspected, CDC advises avoiding ibuprofen and aspirin because of bleeding risk. Ask a clinician or pharmacist before choosing it, especially in pregnancy or with ulcers, kidney disease, blood thinners, or other medicines.", kn: "ಇದು ಹೊಟ್ಟೆಯ ಹುಣ್ಣು ಅಥವಾ ರಕ್ತಸ್ರಾವ ಉಂಟುಮಾಡಬಹುದು ಮತ್ತು ಮೂತ್ರಪಿಂಡಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಬಹುದು. ಡೆಂಗ್ಯೂ ಶಂಕೆಯಿದ್ದರೆ ರಕ್ತಸ್ರಾವದ ಅಪಾಯದಿಂದ ಐಬುಪ್ರೊಫೆನ್ ಮತ್ತು ಆಸ್ಪಿರಿನ್ ತಪ್ಪಿಸಲು CDC ಹೇಳುತ್ತದೆ. ಗರ್ಭಧಾರಣೆ, ಹುಣ್ಣು, ಮೂತ್ರಪಿಂಡ ಕಾಯಿಲೆ, ರಕ್ತ ತೆಳುವಾಗಿಸುವ ಔಷಧಿ ಅಥವಾ ಇತರ ಔಷಧಿಗಳಿದ್ದರೆ ಮೊದಲು ವೈದ್ಯರು ಅಥವಾ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ." },
        source: { label: "CDC · Dengue care", url: "https://www.cdc.gov/dengue/treatment/index.html" },
      },
    ],
    urgent: {
      en: ["Get emergency help now for trouble breathing, confusion, being hard to wake, a seizure, blue lips, or a stiff neck.", "A baby younger than 3 months with a temperature of 38°C / 100.4°F or higher needs urgent medical advice."],
      kn: ["ಉಸಿರಾಟದ ತೊಂದರೆ, ಗೊಂದಲ, ಎಚ್ಚರಗೊಳಿಸಲು ಕಷ್ಟ, ಸೆಳೆತ, ತುಟಿಗಳು ನೀಲಿಯಾಗುವುದು ಅಥವಾ ಕುತ್ತಿಗೆ ಗಟ್ಟಿಯಾಗಿದ್ದರೆ ಈಗಲೇ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.", "3 ತಿಂಗಳಿಗಿಂತ ಕಡಿಮೆ ವಯಸ್ಸಿನ ಮಗುವಿಗೆ 38°C / 100.4°F ಅಥವಾ ಹೆಚ್ಚು ತಾಪಮಾನವಿದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಪಡೆಯಿರಿ."],
    },
    followUp: { en: "If fever is getting worse, lasts several days, or worries you, contact a clinician. A pharmacist can explain the local medicine label.", kn: "ಜ್ವರ ಹೆಚ್ಚಾದರೆ, ಹಲವು ದಿನಗಳಾದರೂ ಕಡಿಮೆಯಾಗದಿದ್ದರೆ ಅಥವಾ ಚಿಂತೆ ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ಸ್ಥಳೀಯ ಔಷಧಿ ಲೇಬಲ್ ವಿವರಿಸಲು ಫಾರ್ಮಸಿಸ್ಟ್ ಸಹಾಯ ಮಾಡಬಹುದು." },
    sources: [
      { label: "MedlinePlus · Fever", url: "https://medlineplus.gov/fever.html" },
      { label: "NHS · Fever in adults", url: "https://www.nhs.uk/symptoms/fever-in-adults/" },
      { label: "CDC · Managing dengue", url: "https://www.cdc.gov/dengue/treatment/index.html" },
    ],
  },
  {
    id: "cough",
    name: { en: "Cough", kn: "ಕೆಮ್ಮು" },
    aliases: ["cough", "coughing", "coff", "cof", "cold cough", "ಕೆಮ್ಮು"],
    intro: {
      en: "Coughs can come from several causes. A cough medicine may only ease the cough for a while; it may not treat the cause or speed recovery.",
      kn: "ಕೆಮ್ಮಿಗೆ ಹಲವು ಕಾರಣಗಳಿರಬಹುದು. ಕೆಮ್ಮಿನ ಔಷಧಿ ಸ್ವಲ್ಪ ಸಮಯ ಮಾತ್ರ ಕೆಮ್ಮನ್ನು ಕಡಿಮೆ ಮಾಡಬಹುದು; ಕಾರಣವನ್ನು ಗುಣಪಡಿಸದು ಅಥವಾ ಬೇಗ ಚೇತರಿಸದು.",
    },
    selfCare: {
      en: ["Rest and drink fluids. A warm drink with honey may soothe a cough for adults and children over 1 year; never give honey to a baby under 1 year.", "Antibiotics do not usually help a cough caused by a virus. Do not use someone else’s prescription medicine."],
      kn: ["ವಿಶ್ರಾಂತಿ ಮಾಡಿ ದ್ರವಗಳನ್ನು ಕುಡಿಯಿರಿ. 1 ವರ್ಷಕ್ಕಿಂತ ಮೇಲ್ಪಟ್ಟವರಿಗೆ ಜೇನುತುಪ್ಪದ ಬೆಚ್ಚಗಿನ ಪಾನೀಯ ಕೆಮ್ಮಿಗೆ ಆರಾಮ ಕೊಡಬಹುದು; 1 ವರ್ಷದೊಳಗಿನ ಮಗುವಿಗೆ ಜೇನುತುಪ್ಪ ಕೊಡಬೇಡಿ.", "ವೈರಸ್‌ನಿಂದ ಬಂದ ಕೆಮ್ಮಿಗೆ ಆಂಟಿಬಯಾಟಿಕ್ ಸಾಮಾನ್ಯವಾಗಿ ಸಹಾಯ ಮಾಡುವುದಿಲ್ಲ. ಬೇರೆಯವರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಔಷಧಿ ಬಳಸಬೇಡಿ."],
    },
    medicineNote: {
      en: "Cough mixtures often combine several ingredients. Check the active ingredients so you do not double up, and ask a pharmacist which products are age-appropriate.",
      kn: "ಕೆಮ್ಮಿನ ಸಿರಪ್‌ಗಳಲ್ಲಿ ಹಲವು ಪದಾರ್ಥಗಳು ಸೇರಿರಬಹುದು. ಒಂದೇ ಪದಾರ್ಥ ಎರಡು ಬಾರಿ ಆಗದಂತೆ ಸಕ್ರಿಯ ಪದಾರ್ಥಗಳನ್ನು ನೋಡಿ; ವಯಸ್ಸಿಗೆ ಸೂಕ್ತವಾದ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ.",
    },
    medicines: [
      {
        name: "Dextromethorphan",
        helps: { en: "An ingredient in some cough products that can temporarily reduce cough. It does not treat the cause or make recovery faster.", kn: "ಕೆಲವು ಕೆಮ್ಮಿನ ಔಷಧಿಗಳಲ್ಲಿರುವ ಪದಾರ್ಥ; ತಾತ್ಕಾಲಿಕವಾಗಿ ಕೆಮ್ಮು ಕಡಿಮೆ ಮಾಡಬಹುದು. ಕಾರಣವನ್ನು ಗುಣಪಡಿಸುವುದಿಲ್ಲ ಅಥವಾ ಚೇತರಿಕೆ ವೇಗಗೊಳಿಸುವುದಿಲ್ಲ." },
        cautions: { en: "Possible effects include dizziness, sleepiness, nausea, or stomach upset. Combination products can duplicate ingredients; age labels differ. Follow the package and ask a pharmacist, especially for a child, pregnancy, asthma, or other medicines.", kn: "ತಲೆಸುತ್ತು, ನಿದ್ರೆ, ವಾಕರಿಕೆ ಅಥವಾ ಹೊಟ್ಟೆ ಅಸ್ವಸ್ಥತೆ ಉಂಟಾಗಬಹುದು. ಮಿಶ್ರ ಔಷಧಿಗಳಲ್ಲಿ ಪದಾರ್ಥಗಳು ಮರುಕಳಿಸಬಹುದು; ವಯಸ್ಸಿನ ಸೂಚನೆ ದೇಶದಂತೆ ಬದಲಾಗುತ್ತದೆ. ವಿಶೇಷವಾಗಿ ಮಗು, ಗರ್ಭಧಾರಣೆ, ಆಸ್ತಮಾ ಅಥವಾ ಇತರ ಔಷಧಿಗಳಿದ್ದರೆ ಪ್ಯಾಕೆಟ್ ನೋಡಿ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ." },
        source: { label: "NIH MedlinePlus · Dextromethorphan", url: "https://medlineplus.gov/druginfo/meds/a682492.html" },
      },
    ],
    urgent: {
      en: ["Get emergency help for severe difficulty breathing, blue lips, or swelling of the face or throat with trouble swallowing.", "Seek prompt medical advice for chest pain, coughing up blood, a very bad or quickly worsening cough, or feeling very unwell."],
      kn: ["ತೀವ್ರ ಉಸಿರಾಟದ ತೊಂದರೆ, ತುಟಿಗಳು ನೀಲಿಯಾಗುವುದು ಅಥವಾ ಮುಖ/ಗಂಟಲು ಊತದ ಜೊತೆಗೆ ನುಂಗಲು ತೊಂದರೆ ಇದ್ದರೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.", "ಎದೆನೋವು, ರಕ್ತದ ಕೆಮ್ಮು, ಬೇಗ ಹದಗೆಡುವ ತೀವ್ರ ಕೆಮ್ಮು ಅಥವಾ ತುಂಬಾ ಅಸ್ವಸ್ಥತೆ ಇದ್ದರೆ ಬೇಗ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಪಡೆಯಿರಿ."],
    },
    followUp: { en: "Contact a clinician if the cough lasts more than 3 weeks, keeps returning, or you have a long-term condition that makes you vulnerable.", kn: "ಕೆಮ್ಮು 3 ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ, ಮತ್ತೆ ಮತ್ತೆ ಬಂದರೆ ಅಥವಾ ಅಪಾಯ ಹೆಚ್ಚಿಸುವ ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆ ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ." },
    sources: [
      { label: "NHS · Cough", url: "https://www.nhs.uk/symptoms/cough/" },
      { label: "NIH MedlinePlus · Cough", url: "https://medlineplus.gov/ency/article/003072.htm" },
    ],
  },
  {
    id: "headache",
    name: { en: "Headache", kn: "ತಲೆನೋವು" },
    aliases: ["headache", "head ache", "hedache", "head pain", "head hurts", "migraine", "ತಲೆನೋವು", "ತಲೆ ನೋವು"],
    intro: {
      en: "Headache has many possible causes. This guide cannot tell which one applies to you.",
      kn: "ತಲೆನೋವಿಗೆ ಹಲವು ಕಾರಣಗಳಿರಬಹುದು. ನಿಮಗೆ ಯಾವ ಕಾರಣ ಎಂದು ಈ ಮಾರ್ಗದರ್ಶಿ ಹೇಳುವುದಿಲ್ಲ.",
    },
    selfCare: {
      en: ["Drink water, rest, eat regular meals, and take a break from screens if that helps. Note when it began and anything that makes it worse.", "If headaches keep returning or are getting worse, arrange advice from a healthcare professional."],
      kn: ["ನೀರು ಕುಡಿಯಿರಿ, ವಿಶ್ರಾಂತಿ ಮಾಡಿ, ಊಟ ತಪ್ಪಿಸಬೇಡಿ; ಸಹಾಯವಾದರೆ ಪರದೆ ನೋಡುವುದರಿಂದ ವಿರಾಮ ತೆಗೆದುಕೊಳ್ಳಿ. ಯಾವಾಗ ಆರಂಭವಾಯಿತು ಮತ್ತು ಏನು ಹೆಚ್ಚಿಸುತ್ತದೆ ಎಂದು ದಾಖಲಿಸಿ.", "ತಲೆನೋವು ಮರುಕಳಿಸಿದರೆ ಅಥವಾ ಹೆಚ್ಚಾಗುತ್ತಿದ್ದರೆ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರ ಸಲಹೆ ಪಡೆಯಿರಿ."],
    },
    medicineNote: {
      en: "Common non-prescription pain-relief ingredients include paracetamol and ibuprofen. Which, if any, is appropriate depends on the person and the local label.",
      kn: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇಲ್ಲದ ನೋವು ನಿವಾರಕಗಳಲ್ಲಿ ಪ್ಯಾರಾಸಿಟಮಾಲ್ ಮತ್ತು ಐಬುಪ್ರೊಫೆನ್ ಸಾಮಾನ್ಯ ಪದಾರ್ಥಗಳು. ಯಾವುದು ಸೂಕ್ತ ಎಂಬುದು ವ್ಯಕ್ತಿ ಮತ್ತು ಸ್ಥಳೀಯ ಲೇಬಲ್ ಮೇಲೆ ಅವಲಂಬಿತ.",
    },
    medicines: [
      {
        name: "Paracetamol (acetaminophen)",
        helps: { en: "Used for some headaches and other mild to moderate pain.", kn: "ಕೆಲವು ತಲೆನೋವು ಮತ್ತು ಸೌಮ್ಯದಿಂದ ಮಧ್ಯಮ ನೋವಿಗೆ ಬಳಸುತ್ತಾರೆ." },
        cautions: { en: "Too much or duplicate ingredients in cold/flu products can harm the liver. Check the package and ask a pharmacist if you have liver disease, are pregnant, or take other medicines.", kn: "ಅತಿಯಾದ ಪ್ರಮಾಣ ಅಥವಾ ಶೀತ/ಫ್ಲೂ ಔಷಧಿಗಳಲ್ಲಿ ಮರುಕಳಿಸುವ ಪದಾರ್ಥ ಯಕೃತ್ತಿಗೆ ಹಾನಿ ಮಾಡಬಹುದು. ಪ್ಯಾಕೆಟ್ ನೋಡಿ; ಯಕೃತ್ತಿನ ಕಾಯಿಲೆ, ಗರ್ಭಧಾರಣೆ ಅಥವಾ ಇತರ ಔಷಧಿಗಳಿದ್ದರೆ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ." },
        source: { label: "NIH MedlinePlus · Acetaminophen", url: "https://medlineplus.gov/druginfo/meds/a681004.html" },
      },
      {
        name: "Ibuprofen (an NSAID)",
        helps: { en: "An ingredient used for pain and inflammation in some products; it may be unsuitable for people with certain conditions or medicines.", kn: "ಕೆಲವು ಉತ್ಪನ್ನಗಳಲ್ಲಿ ನೋವು ಮತ್ತು ಉರಿಯೂತಕ್ಕೆ ಬಳಸುವ ಪದಾರ್ಥ; ಕೆಲವು ಕಾಯಿಲೆ ಅಥವಾ ಔಷಧಿಗಳಿರುವವರಿಗೆ ಸೂಕ್ತವಲ್ಲ." },
        cautions: { en: "It can cause stomach ulcers or bleeding and may affect the kidneys. Ask a pharmacist first if you have ulcers, kidney problems, take blood thinners, or are pregnant.", kn: "ಇದು ಹೊಟ್ಟೆಯ ಹುಣ್ಣು ಅಥವಾ ರಕ್ತಸ್ರಾವ ಉಂಟುಮಾಡಬಹುದು ಮತ್ತು ಮೂತ್ರಪಿಂಡಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಬಹುದು. ಹುಣ್ಣು, ಮೂತ್ರಪಿಂಡದ ಸಮಸ್ಯೆ, ರಕ್ತ ತೆಳುವಾಗಿಸುವ ಔಷಧಿ ಅಥವಾ ಗರ್ಭಧಾರಣೆ ಇದ್ದರೆ ಮೊದಲು ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ." },
        source: { label: "NIH MedlinePlus · Ibuprofen", url: "https://medlineplus.gov/druginfo/meds/a682159.html" },
      },
    ],
    urgent: {
      en: ["Get emergency help for a sudden, extremely severe headache; new weakness or numbness; trouble speaking or seeing; a seizure; or a severe headache with fever and a stiff neck.", "A headache after a serious head injury also needs urgent assessment."],
      kn: ["ಹಠಾತ್ ಅತ್ಯಂತ ತೀವ್ರ ತಲೆನೋವು, ಹೊಸ ದುರ್ಬಲತೆ ಅಥವಾ ಮರಗಟ್ಟುವಿಕೆ, ಮಾತು/ದೃಷ್ಟಿ ತೊಂದರೆ, ಸೆಳೆತ ಅಥವಾ ಜ್ವರದ ಜೊತೆಗೆ ಕುತ್ತಿಗೆ ಗಟ್ಟಿಯಾಗಿದ್ದರೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.", "ಗಂಭೀರ ತಲೆಗೆ ಗಾಯವಾದ ನಂತರದ ತಲೆನೋವಿಗೂ ತುರ್ತು ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ ಬೇಕು."],
    },
    followUp: { en: "If painkillers do not help, headaches keep returning, or the pattern changes, speak with a healthcare professional.", kn: "ನೋವು ನಿವಾರಕಗಳಿಂದ ಸಹಾಯವಾಗದಿದ್ದರೆ, ತಲೆನೋವು ಮರುಕಳಿಸಿದರೆ ಅಥವಾ ಸ್ವರೂಪ ಬದಲಾಗಿದರೆ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರ ಜೊತೆ ಮಾತನಾಡಿ." },
    sources: [
      { label: "NHS · Headache", url: "https://111.wales.nhs.uk/headache/" },
      { label: "NIH MedlinePlus · Acetaminophen", url: "https://medlineplus.gov/druginfo/meds/a681004.html" },
      { label: "NIH MedlinePlus · Ibuprofen", url: "https://medlineplus.gov/druginfo/meds/a682159.html" },
    ],
  },
  {
    id: "leg-pain",
    name: { en: "Leg pain", kn: "ಕಾಲು ನೋವು" },
    aliases: ["leg pain", "pain in my leg", "leg hurts", "legs hurt", "calf pain", "thigh pain", "knee pain", "ಕಾಲು ನೋವು"],
    intro: {
      en: "Leg pain can come from many causes. A pain tablet cannot show what caused it, so check the warning signs below first.",
      kn: "ಕಾಲು ನೋವಿಗೆ ಹಲವು ಕಾರಣಗಳಿರಬಹುದು. ನೋವಿನ ಮಾತ್ರೆ ಕಾರಣವನ್ನು ತೋರಿಸುವುದಿಲ್ಲ; ಮೊದಲು ಕೆಳಗಿನ ಎಚ್ಚರಿಕೆ ಲಕ್ಷಣಗಳನ್ನು ನೋಡಿ.",
    },
    selfCare: {
      en: ["If the pain is mild and began after ordinary activity, note where it hurts, when it began, any injury, and whether it is changing.", "Do not delay medical advice to try a pain medicine when the leg is newly swollen, warm, red, or the pain is severe."],
      kn: ["ಸಾಮಾನ್ಯ ಚಟುವಟಿಕೆಯ ನಂತರ ಸೌಮ್ಯ ನೋವು ಬಂದಿದ್ದರೆ ಎಲ್ಲಿ ನೋವು, ಯಾವಾಗ ಆರಂಭವಾಯಿತು, ಗಾಯವಿದೆಯೇ ಮತ್ತು ನೋವು ಬದಲಾಗುತ್ತಿದೆಯೇ ಎಂದು ದಾಖಲಿಸಿ.", "ಕಾಲಿಗೆ ಹೊಸ ಊತ, ಬಿಸಿ, ಕೆಂಪು ಅಥವಾ ತೀವ್ರ ನೋವು ಇದ್ದರೆ ನೋವಿನ ಔಷಧಿ ಪ್ರಯತ್ನಿಸಲು ವೈದ್ಯಕೀಯ ಸಲಹೆಯನ್ನು ತಡಮಾಡಬೇಡಿ."],
    },
    medicineNote: {
      en: "A general pain-relief ingredient cannot treat a blood clot, fracture, or other cause. Ask a pharmacist which label is safe for you before using any medicine.",
      kn: "ಸಾಮಾನ್ಯ ನೋವು ನಿವಾರಕವು ರಕ್ತದ ಗುಡ್ಡೆ, ಮೂಳೆ ಮುರಿತ ಅಥವಾ ಬೇರೆ ಕಾರಣವನ್ನು ಗುಣಪಡಿಸುವುದಿಲ್ಲ. ಔಷಧಿ ಬಳಸುವ ಮೊದಲು ನಿಮಗೆ ಯಾವ ಲೇಬಲ್ ಸುರಕ್ಷಿತ ಎಂದು ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ.",
    },
    medicines: [
      {
        name: "Paracetamol (acetaminophen)",
        helps: { en: "This ingredient is used for some types of mild to moderate pain; it does not identify or treat why the leg hurts.", kn: "ಈ ಪದಾರ್ಥವನ್ನು ಕೆಲವು ಸೌಮ್ಯದಿಂದ ಮಧ್ಯಮ ನೋವುಗಳಿಗೆ ಬಳಸುತ್ತಾರೆ; ಕಾಲು ಏಕೆ ನೋವು ಎಂಬುದನ್ನು ಪತ್ತೆಹಚ್ಚುವುದಿಲ್ಲ ಅಥವಾ ಕಾರಣವನ್ನು ಚಿಕಿತ್ಸೆ ಮಾಡುವುದಿಲ್ಲ." },
        cautions: { en: "Overdose or duplicate ingredients can seriously harm the liver. Check the local package and ask a pharmacist if you have liver disease, are pregnant, or take other medicines.", kn: "ಅತಿಯಾದ ಪ್ರಮಾಣ ಅಥವಾ ಮರುಕಳಿಸುವ ಪದಾರ್ಥ ಯಕೃತ್ತಿಗೆ ಗಂಭೀರ ಹಾನಿ ಮಾಡಬಹುದು. ಸ್ಥಳೀಯ ಪ್ಯಾಕೆಟ್ ನೋಡಿ; ಯಕೃತ್ತಿನ ಕಾಯಿಲೆ, ಗರ್ಭಧಾರಣೆ ಅಥವಾ ಇತರ ಔಷಧಿಗಳಿದ್ದರೆ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ." },
        source: { label: "NIH MedlinePlus · Acetaminophen", url: "https://medlineplus.gov/druginfo/meds/a681004.html" },
      },
    ],
    urgent: {
      en: ["Get urgent medical help for new pain with swelling, warmth, or red/dark skin in one leg.", "If leg pain or swelling happens with chest pain, shortness of breath, fainting, or coughing blood, call your local emergency number now."],
      kn: ["ಒಂದು ಕಾಲಿನಲ್ಲಿ ಹೊಸ ನೋವಿನ ಜೊತೆಗೆ ಊತ, ಬಿಸಿ ಅಥವಾ ಕೆಂಪು/ಗಾಢ ಚರ್ಮ ಇದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ.", "ಕಾಲು ನೋವು/ಊತದ ಜೊತೆಗೆ ಎದೆನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ, ಮೂರ್ಛೆ ಅಥವಾ ರಕ್ತದ ಕೆಮ್ಮು ಇದ್ದರೆ ಈಗಲೇ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ."],
    },
    followUp: { en: "If pain is severe after an injury, you cannot put weight on the leg, or it is not improving, seek medical advice.", kn: "ಗಾಯದ ನಂತರ ತೀವ್ರ ನೋವು, ಕಾಲಿನ ಮೇಲೆ ನಿಲ್ಲಲು ಆಗದಿರುವುದು ಅಥವಾ ಸುಧಾರಣೆ ಇಲ್ಲದಿದ್ದರೆ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಪಡೆಯಿರಿ." },
    sources: [
      { label: "NHS · Deep vein thrombosis", url: "https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/" },
      { label: "NHS · Leg pain", url: "https://www.leicspart.nhs.uk/msk-physiotherapy-resources-getting-started/lower-limb/leg/" },
    ],
  },
  {
    id: "stomach-pain",
    name: { en: "Stomach pain", kn: "ಹೊಟ್ಟೆ ನೋವು" },
    aliases: ["stomach pain", "stomache pain", "stomack pain", "stomach hurts", "my stomach hurts", "belly pain", "tummy pain", "tummy hurts", "my tummy hurts", "abdominal pain", "ಹೊಟ್ಟೆ ನೋವು"],
    intro: {
      en: "Stomach or belly pain has many possible causes. The wrong medicine can hide an important problem, so this guide does not pick a tablet.",
      kn: "ಹೊಟ್ಟೆ ನೋವಿಗೆ ಹಲವು ಕಾರಣಗಳಿರಬಹುದು. ತಪ್ಪಾದ ಔಷಧಿ ಮುಖ್ಯ ಸಮಸ್ಯೆಯನ್ನು ಮರೆಮಾಡಬಹುದು; ಆದ್ದರಿಂದ ಈ ಮಾರ್ಗದರ್ಶಿ ಮಾತ್ರೆ ಆಯ್ಕೆಮಾಡುವುದಿಲ್ಲ.",
    },
    selfCare: {
      en: ["If discomfort is mild, note exactly where it hurts, when it began, and any vomiting, bowel, urine, or fever changes. Sip fluids if you can.", "Avoid taking a new pain medicine without checking the label or asking a pharmacist, especially if you have other conditions or take other medicines."],
      kn: ["ನೋವು ಸೌಮ್ಯವಾಗಿದ್ದರೆ ಎಲ್ಲಿ ನೋವು, ಯಾವಾಗ ಆರಂಭವಾಯಿತು, ವಾಂತಿ, ಮಲ/ಮೂತ್ರ ಅಥವಾ ಜ್ವರದಲ್ಲಿ ಬದಲಾವಣೆ ಇದೆಯೇ ಎಂದು ದಾಖಲಿಸಿ. ಸಾಧ್ಯವಾದರೆ ಸಣ್ಣ ಸಿಪ್‌ಗಳಲ್ಲಿ ದ್ರವ ಕುಡಿಯಿರಿ.", "ಲೇಬಲ್ ಪರಿಶೀಲಿಸದೆ ಅಥವಾ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳದೆ ಹೊಸ ನೋವಿನ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ; ವಿಶೇಷವಾಗಿ ಬೇರೆ ಕಾಯಿಲೆ ಅಥವಾ ಔಷಧಿಗಳಿದ್ದರೆ."],
    },
    medicineNote: {
      en: "There is no single tablet that is right for all stomach pain. Some pain medicines, including NSAIDs such as ibuprofen, can irritate the stomach or cause bleeding.",
      kn: "ಎಲ್ಲಾ ಹೊಟ್ಟೆ ನೋವಿಗೂ ಒಂದೇ ಮಾತ್ರೆ ಸೂಕ್ತವಲ್ಲ. ಐಬುಪ್ರೊಫೆನ್‌ನಂತಹ ಕೆಲವು ನೋವಿನ ಔಷಧಿಗಳು ಹೊಟ್ಟೆಗೆ ತೊಂದರೆ ಅಥವಾ ರಕ್ತಸ್ರಾವ ಉಂಟುಮಾಡಬಹುದು.",
    },
    medicines: [
      {
        name: "Ibuprofen (an NSAID) — caution",
        helps: { en: "It is used for pain in some situations, but it is not a general answer for unexplained stomach pain.", kn: "ಕೆಲವು ಸಂದರ್ಭಗಳಲ್ಲಿ ನೋವಿಗೆ ಬಳಸುತ್ತಾರೆ; ಆದರೆ ಕಾರಣ ತಿಳಿಯದ ಹೊಟ್ಟೆ ನೋವಿಗೆ ಇದು ಸಾಮಾನ್ಯ ಪರಿಹಾರವಲ್ಲ." },
        cautions: { en: "It can cause stomach ulcers or bleeding. Avoid choosing it for unexplained stomach pain without a pharmacist or clinician’s advice.", kn: "ಇದು ಹೊಟ್ಟೆಯ ಹುಣ್ಣು ಅಥವಾ ರಕ್ತಸ್ರಾವ ಉಂಟುಮಾಡಬಹುದು. ಕಾರಣ ತಿಳಿಯದ ಹೊಟ್ಟೆ ನೋವಿಗೆ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಇದನ್ನು ಆಯ್ಕೆಮಾಡಬೇಡಿ." },
        source: { label: "NIH MedlinePlus · Ibuprofen", url: "https://medlineplus.gov/druginfo/meds/a682159.html" },
      },
    ],
    urgent: {
      en: ["Get emergency help for sudden severe pain, a hard/tender belly, blood in vomit or stool, trouble breathing, or possible pregnancy with pain.", "Seek prompt care if pain is getting worse or comes with repeated vomiting."],
      kn: ["ಹಠಾತ್ ತೀವ್ರ ನೋವು, ಗಟ್ಟಿಯಾದ/ಸ್ಪರ್ಶಕ್ಕೆ ನೋವುಳ್ಳ ಹೊಟ್ಟೆ, ವಾಂತಿ ಅಥವಾ ಮಲದಲ್ಲಿ ರಕ್ತ, ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ನೋವಿನ ಜೊತೆಗೆ ಗರ್ಭಧಾರಣೆ ಸಾಧ್ಯತೆ ಇದ್ದರೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.", "ನೋವು ಹೆಚ್ಚಾದರೆ ಅಥವಾ ಮರುಮರು ವಾಂತಿಯಿದ್ದರೆ ಬೇಗ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ."],
    },
    followUp: { en: "Contact a clinician if pain lasts, gets worse, or repeatedly returns. Keep the medicine package with you when asking for help.", kn: "ನೋವು ಮುಂದುವರಿದರೆ, ಹೆಚ್ಚಾದರೆ ಅಥವಾ ಮತ್ತೆ ಮತ್ತೆ ಬಂದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ಸಹಾಯ ಕೇಳುವಾಗ ಔಷಧಿ ಪ್ಯಾಕೆಟ್ ಜೊತೆಯಲ್ಲಿ ಇಡಿ." },
    sources: [
      { label: "NIH MedlinePlus · Abdominal pain", url: "https://medlineplus.gov/ency/article/003120.htm" },
      { label: "NIH MedlinePlus · Ibuprofen", url: "https://medlineplus.gov/druginfo/meds/a682159.html" },
    ],
  },
  {
    id: "nausea",
    name: { en: "Nausea or vomiting", kn: "ವಾಕರಿಕೆ ಅಥವಾ ವಾಂತಿ" },
    aliases: ["nausea", "feel sick", "feeling sick", "vomiting", "throwing up", "vomit", "ವಾಕರಿಕೆ", "ವಾಂತಿ"],
    intro: {
      en: "Nausea and vomiting can have many causes. Anti-sickness medicines are not interchangeable, and some need a prescription.",
      kn: "ವಾಕರಿಕೆ ಮತ್ತು ವಾಂತಿಗೆ ಹಲವು ಕಾರಣಗಳಿರಬಹುದು. ವಾಂತಿ ತಡೆಯುವ ಔಷಧಿಗಳು ಪರಸ್ಪರ ಬದಲಾಯಿಸಲು ಆಗುವುದಿಲ್ಲ; ಕೆಲವು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಗತ್ಯವಿದೆ.",
    },
    selfCare: {
      en: ["If you can, take small frequent sips of water or an oral rehydration drink. Keep track of how often you vomit and whether you can keep fluids down.", "Do not take another person’s anti-sickness medicine. Ask a pharmacist or clinician what is suitable for your age, other medicines, and possible cause."],
      kn: ["ಸಾಧ್ಯವಾದರೆ ನೀರು ಅಥವಾ ORS ಅನ್ನು ಸ್ವಲ್ಪ ಸ್ವಲ್ಪವಾಗಿ ಆಗಾಗ ಕುಡಿಯಿರಿ. ಎಷ್ಟು ಬಾರಿ ವಾಂತಿ ಆಗುತ್ತದೆ ಮತ್ತು ದ್ರವ ಉಳಿಯುತ್ತಿದೆಯೇ ಎಂದು ಗಮನಿಸಿ.", "ಬೇರೆಯವರ ವಾಂತಿ ತಡೆಯುವ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ. ನಿಮ್ಮ ವಯಸ್ಸು, ಇತರ ಔಷಧಿ ಮತ್ತು ಸಾಧ್ಯ ಕಾರಣಕ್ಕೆ ಯಾವುದು ಸೂಕ್ತ ಎಂದು ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಕೇಳಿ."],
    },
    medicineNote: {
      en: "There is no one anti-nausea tablet that is safe for everyone. The right information depends on age, pregnancy, other medicines, and the reason for nausea.",
      kn: "ಎಲ್ಲರಿಗೂ ಸುರಕ್ಷಿತವಾದ ಒಂದೇ ವಾಕರಿಕೆ ಮಾತ್ರೆ ಇಲ್ಲ. ವಯಸ್ಸು, ಗರ್ಭಧಾರಣೆ, ಇತರ ಔಷಧಿ ಮತ್ತು ವಾಕರಿಕೆಯ ಕಾರಣದ ಮೇಲೆ ಮಾಹಿತಿ ಅವಲಂಬಿತವಾಗಿದೆ.",
    },
    urgent: {
      en: ["Get prompt care for blood or coffee-ground-like vomit, severe stomach pain, fainting, confusion, or signs of dehydration.", "Seek medical help if you cannot keep liquids down or vomiting continues."],
      kn: ["ವಾಂತಿಯಲ್ಲಿ ರಕ್ತ ಅಥವಾ ಕಾಫಿ ಪುಡಿಯಂತಿರುವ ವಸ್ತು, ತೀವ್ರ ಹೊಟ್ಟೆ ನೋವು, ಮೂರ್ಛೆ, ಗೊಂದಲ ಅಥವಾ ನೀರಿನ ಕೊರತೆ ಲಕ್ಷಣಗಳಿದ್ದರೆ ಬೇಗ ಸಹಾಯ ಪಡೆಯಿರಿ.", "ದ್ರವ ಉಳಿಸಿಕೊಳ್ಳಲು ಆಗದಿದ್ದರೆ ಅಥವಾ ವಾಂತಿ ಮುಂದುವರಿದರೆ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ."],
    },
    followUp: { en: "Ask a clinician or pharmacist before trying a medicine, especially for a child, pregnancy, or someone with diabetes or cancer treatment.", kn: "ಔಷಧಿ ಪ್ರಯತ್ನಿಸುವ ಮೊದಲು ವೈದ್ಯರು ಅಥವಾ ಫಾರ್ಮಸಿಸ್ಟ್‌ರನ್ನು ಕೇಳಿ; ವಿಶೇಷವಾಗಿ ಮಗು, ಗರ್ಭಿಣಿ, ಮಧುಮೇಹ ಅಥವಾ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ ಪಡೆಯುವವರಿಗಾಗಿ." },
    sources: [{ label: "NIH MedlinePlus · Nausea and vomiting", url: "https://medlineplus.gov/ency/patientinstructions/000122.htm" }],
  },
  {
    id: "skin",
    name: { en: "Rash or skin concern", kn: "ಚರ್ಮದ ದದ್ದು ಅಥವಾ ಸಮಸ್ಯೆ" },
    aliases: ["rash", "itchy skin", "itching", "skin rash", "skin problem", "hives", "ದದ್ದು", "ಚರ್ಮದ ಸಮಸ್ಯೆ"],
    intro: {
      en: "Rashes can look similar but have different causes. A tablet that helps one rash may be wrong for another.",
      kn: "ಚರ್ಮದ ದದ್ದುಗಳು ಒಂದೇ ರೀತಿ ಕಾಣಿಸಿದರೂ ಕಾರಣ ಬೇರೆ ಇರಬಹುದು. ಒಂದು ದದ್ದಿಗೆ ಸಹಾಯ ಮಾಡುವ ಮಾತ್ರೆ ಮತ್ತೊಂದಕ್ಕೆ ತಪ್ಪಾಗಬಹುದು.",
    },
    selfCare: {
      en: ["Note when it started, where it is, whether it is spreading, and any new food, medicine, soap, or product. A clear photo can help a clinician compare changes.", "Avoid scratching and do not start a new cream or tablet until you have checked that it suits the cause and person."],
      kn: ["ಯಾವಾಗ ಆರಂಭವಾಯಿತು, ಎಲ್ಲಿ ಇದೆ, ಹರಡುತ್ತಿದೆಯೇ ಮತ್ತು ಹೊಸ ಆಹಾರ, ಔಷಧಿ, ಸಾಬೂನು ಅಥವಾ ಉತ್ಪನ್ನ ಬಳಸಿದ್ದೀರಾ ಎಂದು ದಾಖಲಿಸಿ. ಬದಲಾವಣೆ ಹೋಲಿಸಲು ಸ್ಪಷ್ಟ ಫೋಟೋ ವೈದ್ಯರಿಗೆ ಸಹಾಯ ಮಾಡಬಹುದು.", "ಗೀಳಬೇಡಿ; ಕಾರಣ ಮತ್ತು ವ್ಯಕ್ತಿಗೆ ಸೂಕ್ತವೆಂದು ಖಚಿತಪಡಿಸದೆ ಹೊಸ ಕ್ರೀಮ್ ಅಥವಾ ಮಾತ್ರೆ ಆರಂಭಿಸಬೇಡಿ."],
    },
    medicineNote: {
      en: "This app cannot identify a rash from symptoms alone. A pharmacist or clinician can help decide whether an antihistamine or another treatment is appropriate.",
      kn: "ಲಕ್ಷಣಗಳಿಂದ ಮಾತ್ರ ದದ್ದನ್ನು ಈ ಆಪ್ ಗುರುತಿಸಲಾರದು. ಆಂಟಿಹಿಸ್ಟಮಿನ್ ಅಥವಾ ಬೇರೆ ಚಿಕಿತ್ಸೆ ಸೂಕ್ತವೇ ಎಂದು ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರು ಸಹಾಯ ಮಾಡಬಹುದು.",
    },
    urgent: {
      en: ["Call your local emergency number now for a rash with swelling of the face, lips, tongue, or throat; trouble breathing or swallowing; fainting; or a rapidly spreading blistering rash.", "Seek prompt advice if a new rash appears with fever, severe pain, or after starting a medicine."],
      kn: ["ಮುಖ, ತುಟಿ, ನಾಲಿಗೆ ಅಥವಾ ಗಂಟಲು ಊತ; ಉಸಿರಾಟ/ನುಂಗುವ ತೊಂದರೆ; ಮೂರ್ಛೆ; ಅಥವಾ ವೇಗವಾಗಿ ಹರಡುವ ಗುಳ್ಳೆ ದದ್ದು ಇದ್ದರೆ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಈಗಲೇ ಕರೆ ಮಾಡಿ.", "ಹೊಸ ದದ್ದಿನ ಜೊತೆಗೆ ಜ್ವರ, ತೀವ್ರ ನೋವು ಅಥವಾ ಹೊಸ ಔಷಧಿ ಆರಂಭಿಸಿದ ನಂತರ ಕಾಣಿಸಿದರೆ ಬೇಗ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಪಡೆಯಿರಿ."],
    },
    followUp: { en: "If the rash is spreading, keeps returning, or does not improve, ask a pharmacist or clinician to look at it.", kn: "ದದ್ದು ಹರಡುತ್ತಿದ್ದರೆ, ಮರುಕಳಿಸಿದರೆ ಅಥವಾ ಸುಧಾರಿಸದಿದ್ದರೆ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ತೋರಿಸಿ." },
    sources: [{ label: "NHS · Hives and allergic reactions", url: "https://www.nhs.uk/conditions/hives/" }],
  },
];

export function findSymptomGuide(query: string): { guide: SymptomGuideTopic; correction?: string } | null {
  const normalized = query.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  for (const guide of SYMPTOM_GUIDES) {
    for (const rawAlias of guide.aliases) {
      const alias = rawAlias.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
      if (alias && normalized.includes(alias)) return { guide };
    }
  }
  const ignored = new Set(["about", "are", "can", "did", "does", "for", "from", "have", "help", "here", "how", "just", "like", "me", "my", "need", "not", "please", "should", "some", "take", "tell", "that", "the", "this", "what", "when", "which", "with", "would", "you"]);
  const words = normalized.split(" ").filter((word) => word.length >= 3 && !ignored.has(word));
  const distance = (a: string, b: string) => {
    if (Math.abs(a.length - b.length) > 1) return 2;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++) row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = row;
    }
    return previous[b.length];
  };
  const scores = SYMPTOM_GUIDES.map((guide) => {
    let exact = 0;
    let fuzzy = 0;
    let correction = "";
    const aliasWords = guide.aliases.flatMap((alias) => alias.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u)).filter((part) => part.length >= 3);
    for (const word of words) {
      if (aliasWords.includes(word)) { exact += 1; continue; }
      if (word.length < 4 && words.length === 1) continue;
      const candidate = aliasWords.find((part) => distance(word, part) === 1);
      if (candidate) { fuzzy += 1; if (!correction) correction = candidate; }
    }
    return { guide, exact, fuzzy, correction };
  }).filter((score) => score.exact > 0 || (score.fuzzy > 0 && words.length === 1 && words[0].length >= 4));
  scores.sort((a, b) => (b.exact * 3 + b.fuzzy) - (a.exact * 3 + a.fuzzy));
  const best = scores[0];
  if (!best) return null;
  const bestScore = best.exact * 3 + best.fuzzy;
  const tied = scores.filter((score) => score.exact * 3 + score.fuzzy === bestScore);
  if (tied.length !== 1) return null;
  return { guide: best.guide, correction: best.correction || undefined };
}

const COMMON_MEDICINES = [
  { name: "Paracetamol", aliases: ["paracetamol", "acetaminophen"] },
  { name: "Ibuprofen", aliases: ["ibuprofen"] },
  { name: "Dextromethorphan", aliases: ["dextromethorphan"] },
];

export function findMedicineSpelling(query: string): { medicine: string; typed: string; correction?: string } | null {
  const normalized = " " + query.toLocaleLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim() + " ";
  if (normalized.trim().length === 0) return null;
  for (const item of COMMON_MEDICINES) {
    for (const alias of item.aliases) {
      const padded = ` ${alias} `;
      if (normalized.includes(padded)) return { medicine: item.name, typed: alias };
    }
  }
  const words = normalized.trim().split(/\s+/).filter((word) => word.length >= 5);
  const distance = (a: string, b: string) => {
    if (Math.abs(a.length - b.length) > 1) return 2;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++) row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = row;
    }
    return previous[b.length];
  };
  const suggestions = COMMON_MEDICINES.flatMap((item) => item.aliases.map((alias) => ({ item, alias })))
    .flatMap(({ item, alias }) => words.filter((word) => distance(word, alias) === 1).map((word) => ({ item, alias, word })));
  if (suggestions.length !== 1) return null;
  const suggestion = suggestions[0];
  return { medicine: suggestion.item.name, typed: suggestion.word, correction: suggestion.alias };
}

export function findMedicineInQuestion(query: string): string | null {
  return findMedicineSpelling(query)?.medicine ?? null;
}

