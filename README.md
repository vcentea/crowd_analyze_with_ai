# Crowd Engagement & Sentiment Analysis – Legal & Compliance Statement  
**Version 2.0 · 21 May 2025**

---

## 1 · Application Overview
The software captures one frame of an audience every **3-5 s**, computes **aggregate** metrics, then deletes the frame in **< 1 s**.

| Metric kept | Description |
|-------------|-------------|
| `peopleCount` | Total faces in frame |
| `engagementPercentage` | % looking toward the stage (eye & head pose) |
| `dominantEmotion` | Highest-confidence crowd emotion |
| Demographics | Average age · % male · % female |

**Privacy by design**

* No face templates, IDs or tokens stored  
* Frames exist only in RAM  
* All persisted data is fully anonymous


## 2 · GDPR Compliance (Reg. EU 2016/679)

| Requirement                             | How we comply                                                                                   |
|-----------------------------------------|------------------------------------------------------------------------------------------------|
| **Legal basis** (Art 6 §1 f)            | *Legitimate interest* → live demo; minimal privacy impact                                       |
| **Data minimisation & storage** (Art 5 §1 c-e) | Images deleted in < 1 s; retained data anonymous (Recital 26)                                    |
| **Transparency** (Art 13)               | Poster/slide: “🚨 Live AI engagement demo. Images auto-deleted; only aggregates stored.”        |
| **DPIA** (Art 35)                       | One-page DPIA on file (risk rated low)                                                         |
| **International transfers** (Ch V)      | Processing locked to AWS **eu-central-1**; no data exit EEA                                     |

Reference: [GDPR full text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)

---

## 3 · EU AI Act Compliance (Reg. EU 2024/1689)

| Topic                              | Detail                                                                                     |
|------------------------------------|-------------------------------------------------------------------------------------------|
| **System type**                    | *Emotion-recognition AI* (Art 3 §39) – infers attention & emotion                          |
| **Public settings**                | Permitted at conferences/exhibitions with transparency duty (Art 50 §3)                    |
| **High-risk test**                 | Not listed in Annex III → **not** high-risk                                               |
| **Timeline**                       | Transparency chapter enforceable mid-2026 – compliance adopted early                      |

Reference: [AI Act full text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689)

---

## 4 · Schools & Workplaces – Strict Ban

**Article 5 §1 f of the AI Act bans any AI that infers emotions or mental states in**  
*classrooms* **or** *workplaces* **unless the sole purpose is medical or safety-critical.**

- The present application **may not be used** for student or employee monitoring.  
- **Allowed exception:** safety-critical systems (e.g., driver fatigue detection) with documented necessity.

### Restricted version for schools/workplaces

A variant that **only counts occupancy** (e.g., infrared or silhouette detection) and stores **no** attention/emotion data falls outside both GDPR and AI Act bans and can be used in these settings.

---

## 5 · Record of Processing (GDPR Art 30 summary)

| Field             | Value                                                              |
|-------------------|--------------------------------------------------------------------|
| **Controller**    | EXIGE SARL · 8 op Bierg, L-8217 Mamer, Luxembourg                  |
| **Purpose**       | Real-time demonstration of anonymous audience engagement & sentiment |
| **Data categories** | Transient images (deleted) · Anonymous aggregates (stored)       |
| **Recipients**    | None                                                               |
| **Retention**     | Images: < 1 s (RAM only); Aggregates: permanent                    |
| **Security**      | RAM-only buffer · HTTPS · IAM-scoped roles · EU-only datacentres    |

---

## 6 · Disclaimer

This notice is provided for information only and does **not** constitute formal legal advice.  
For detailed guidance, consult a qualified attorney.
