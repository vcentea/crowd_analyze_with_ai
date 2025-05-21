# Crowd-Sentiment Demo – Legal & Compliance Statement  
Version 1.0 • Last updated 21 May 2025

## 1. System description
The application captures a live still frame of the audience every 3-5 s, computes **aggregate statistics** (people count, age mean, gender split, dominant emotion, engagement score) and **immediately deletes** the frame.  
No face IDs, templates or tokens are stored; only the final table row is retained.

## 2. GDPR (Regulation (EU) 2016/679)

| Topic | Compliance argument |
|-------|---------------------|
| **Personal-data phase** | The transient image is “personal data” until deleted. Processing rests on *legitimate interest* (Art 6 §1 f) – real-time demo, minimal impact :contentReference[oaicite:0]{index=0}. |
| **Data-minimisation & storage** | Frames live < 1 s in RAM; no biometric template persists. The retained row is *anonymous* under Recital 26 because it cannot single-out a person :contentReference[oaicite:1]{index=1}. |
| **Transparency** | A short notice (poster/slide) at the entrance satisfies Art 13 info duties :contentReference[oaicite:2]{index=2}. |
| **DPIA check** | Large-scale public monitoring can trigger Art 35. Risk is low after instant deletion, but a one-page DPIA template is kept :contentReference[oaicite:3]{index=3}. |
| **International transfers** | Rekognition is locked to *eu-central-1*. No third-country transfer occurs, so Chapter V is not engaged. |

## 3. EU Artificial Intelligence Act (Regulation (EU) 2024/1689)

| Point | Explanation |
|-------|-------------|
| **Classification** | The tool is an *emotion-recognition system* (definition §39) :contentReference[oaicite:4]{index=4}. Not used in schools or workplaces ⇒ **not banned**. |
| **Transparency duty** | Deployers must inform persons exposed (Art 50 §3) :contentReference[oaicite:5]{index=5}. The same poster/slide meets this duty. |
| **High-risk check** | Generic crowd analytics outside the Annex III contexts ⇒ **not high-risk**. |
| **Timeline** | Transparency Chapter applies from mid-2026; early compliance adopted now. |

## 4. Records of processing (GDPR Art 30, summary)

| Field | Value |
|-------|-------|
| Controller | EXIGE SARL – 8 op Bierg, 8217 Mamer, Luxembourg |
| Purpose | Real-time, aggregate sentiment demonstration |
| Categories | Transient facial images (deleted), anonymous aggregate metrics (stored) |
| Recipients | None |
| Retention | Images: < 1 s (memory). Metrics: permanent (anonymous). |
| Technical & organisational measures | RAM-only buffer, HTTPS, IAM-scoped Lambda role, EU region lock |

> **Disclaimer:** This statement is provided for information and documentation purposes only and does **not** constitute formal legal advice.

