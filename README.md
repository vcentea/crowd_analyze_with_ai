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

```jsonc
// Example of stored record
{
  "timestamp": "2025-05-21T14:30:00Z",
  "peopleCount": 120,
  "averageAge": 35,
  "malePercentage": 48,
  "femalePercentage": 52,
  "engagementPercentage": 74,
  "dominantEmotion": "Calm"
}
