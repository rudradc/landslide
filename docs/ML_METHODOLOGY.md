# Machine Learning & Explainable AI (XAI) Methodology

## AI/ML Classification Pipeline

1. **Feature Engineering**: Features include terrain slope angle, annual rainfall, distance to river, distance to road, hospital proximity, housing quality, and population density.
2. **Algorithms**:
   - Random Forest Classifier (100 Decision Trees)
   - XGBoost Gradient Boosted Trees
   - Logistic Regression Baseline
3. **Validation**: 75/25 Train-Test Split evaluated using Accuracy, Precision, Recall, F1-Score, and Confusion Matrix metrics.
4. **Explainability**: XGBoost TreeSHAP feature importance attributions quantify relative indicator contributions.
