package cards

import "time"

type CardDTO struct {
    ID            string     `json:"id"`
    UserID        string     `json:"userId"`
    Question      string     `json:"question"`
    Answer        string     `json:"answer"`
    Priority      int        `json:"priority"`
    EaseFactor    float64    `json:"easeFactor"`
    IntervalDays  int        `json:"intervalDays"`
    LastShownAt   *time.Time `json:"lastShownAt"`
    NextReviewAt  *time.Time `json:"nextReviewAt"`
    CreatedAt     time.Time  `json:"createdAt"`
}

type CreateCardInput struct {
    Question string `json:"question"`
    Answer   string `json:"answer"`
    Tags     []string `json:"tags"`
}