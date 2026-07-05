import json
from sqlalchemy.orm import Session
from app.db.database import DiseaseData, AQIHistory, init_db, SessionLocal
import os

def seed_database():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(DiseaseData).first() is not None:
            print("Database already seeded.")
            return

        # Seed disease surveillance data
        disease_data = [
            # Ward 1 (Baseline)
            {"ward": "Ward 1", "week": "Week 1", "cases": 3, "rainfall_mm": 12.0},
            {"ward": "Ward 1", "week": "Week 2", "cases": 4, "rainfall_mm": 15.0},
            {"ward": "Ward 1", "week": "Week 3", "cases": 3, "rainfall_mm": 80.0},
            {"ward": "Ward 1", "week": "Week 4", "cases": 5, "rainfall_mm": 14.0},
            {"ward": "Ward 1", "week": "Week 5", "cases": 6, "rainfall_mm": 10.0},
            {"ward": "Ward 1", "week": "Week 6", "cases": 7, "rainfall_mm": 5.0},
            {"ward": "Ward 1", "week": "Week 7", "cases": 5, "rainfall_mm": 8.0},
            {"ward": "Ward 1", "week": "Week 8", "cases": 4, "rainfall_mm": 12.0},

            # Ward 2 (Baseline)
            {"ward": "Ward 2", "week": "Week 1", "cases": 2, "rainfall_mm": 12.0},
            {"ward": "Ward 2", "week": "Week 2", "cases": 2, "rainfall_mm": 15.0},
            {"ward": "Ward 2", "week": "Week 3", "cases": 3, "rainfall_mm": 80.0},
            {"ward": "Ward 2", "week": "Week 4", "cases": 3, "rainfall_mm": 14.0},
            {"ward": "Ward 2", "week": "Week 5", "cases": 4, "rainfall_mm": 10.0},
            {"ward": "Ward 2", "week": "Week 6", "cases": 5, "rainfall_mm": 5.0},
            {"ward": "Ward 2", "week": "Week 7", "cases": 4, "rainfall_mm": 8.0},
            {"ward": "Ward 2", "week": "Week 8", "cases": 3, "rainfall_mm": 12.0},

            # Ward 3 (Outbreak - Dengue & Flu rise)
            {"ward": "Ward 3", "week": "Week 1", "cases": 5, "rainfall_mm": 10.0},
            {"ward": "Ward 3", "week": "Week 2", "cases": 6, "rainfall_mm": 12.0},
            {"ward": "Ward 3", "week": "Week 3", "cases": 4, "rainfall_mm": 85.0}, # Monsoon rainfall spike!
            {"ward": "Ward 3", "week": "Week 4", "cases": 8, "rainfall_mm": 15.0}, # Water logging
            {"ward": "Ward 3", "week": "Week 5", "cases": 18, "rainfall_mm": 8.0}, # Dengue cases starting to climb
            {"ward": "Ward 3", "week": "Week 6", "cases": 32, "rainfall_mm": 5.0}, # Outbreak peak (cases risen 300% since Week 4)
            {"ward": "Ward 3", "week": "Week 7", "cases": 45, "rainfall_mm": 10.0}, # High prevalence
            {"ward": "Ward 3", "week": "Week 8", "cases": 25, "rainfall_mm": 12.0}, # Decline due to civic interventions

            # Ward 4 (Moderate)
            {"ward": "Ward 4", "week": "Week 1", "cases": 4, "rainfall_mm": 15.0},
            {"ward": "Ward 4", "week": "Week 2", "cases": 3, "rainfall_mm": 10.0},
            {"ward": "Ward 4", "week": "Week 3", "cases": 5, "rainfall_mm": 90.0},
            {"ward": "Ward 4", "week": "Week 4", "cases": 6, "rainfall_mm": 20.0},
            {"ward": "Ward 4", "week": "Week 5", "cases": 10, "rainfall_mm": 12.0},
            {"ward": "Ward 4", "week": "Week 6", "cases": 15, "rainfall_mm": 6.0},
            {"ward": "Ward 4", "week": "Week 7", "cases": 18, "rainfall_mm": 8.0},
            {"ward": "Ward 4", "week": "Week 8", "cases": 11, "rainfall_mm": 10.0},

            # Ward 5 (Baseline)
            {"ward": "Ward 5", "week": "Week 1", "cases": 1, "rainfall_mm": 8.0},
            {"ward": "Ward 5", "week": "Week 2", "cases": 2, "rainfall_mm": 10.0},
            {"ward": "Ward 5", "week": "Week 3", "cases": 2, "rainfall_mm": 70.0},
            {"ward": "Ward 5", "week": "Week 4", "cases": 3, "rainfall_mm": 12.0},
            {"ward": "Ward 5", "week": "Week 5", "cases": 4, "rainfall_mm": 8.0},
            {"ward": "Ward 5", "week": "Week 6", "cases": 5, "rainfall_mm": 4.0},
            {"ward": "Ward 5", "week": "Week 7", "cases": 3, "rainfall_mm": 5.0},
            {"ward": "Ward 5", "week": "Week 8", "cases": 2, "rainfall_mm": 10.0},
        ]

        for item in disease_data:
            db.add(DiseaseData(**item))

        # Save to JSON file as well
        os.makedirs("data", exist_ok=True)
        with open("data/sample_disease_data.json", "w") as f:
            json.dump(disease_data, f, indent=4)

        # Seed AQI 7-day history for Patna, Delhi, Mumbai, Bengaluru
        aqi_histories = {
            "Patna": [120.0, 125.0, 130.0, 145.0, 160.0, 185.0, 210.0],
            "Delhi": [210.0, 230.0, 245.0, 260.0, 290.0, 310.0, 340.0],
            "Mumbai": [65.0, 70.0, 75.0, 80.0, 85.0, 90.0, 95.0],
            "Bengaluru": [40.0, 42.0, 45.0, 48.0, 52.0, 55.0, 58.0]
        }

        dates = ["2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05"]

        for city, aqi_list in aqi_histories.items():
            for idx, aqi in enumerate(aqi_list):
                db.add(AQIHistory(city=city, date=dates[idx], aqi=aqi))

        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_database()
