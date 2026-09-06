# Mathematical Risk Scoring Methodology

## Multi-Criteria Decision Analysis (MCDA) Framework

The system models risk ($R$) as a normalized multi-factor index (0–100):

$$R = w_H \cdot H + w_V \cdot V + w_{CP} \cdot CP + w_{IR} \cdot IR + w_{Hist} \cdot Hist$$

### Configurable Baseline Weights:
- $w_H = 0.30$ (Hazard Exposure)
- $w_V = 0.25$ (Vulnerability Index)
- $w_{CP} = 0.20$ (Carrying Capacity Pressure)
- $w_{IR} = 0.15$ (Infrastructure & Emergency Isolation)
- $w_{Hist} = 0.10$ (Historical Disaster Exposure)

### Risk Classification Thresholds:
- **0.0 – 24.9**: Low Risk (Green)
- **25.0 – 49.9**: Moderate Risk (Yellow)
- **50.0 – 74.9**: High Risk (Orange)
- **75.0 – 100.0**: Critical Risk / Red-Zone (Red)

### Carrying Capacity Bottleneck Equation:
$$C_{safe} = \min\left(C_{land}, C_{water}, C_{health}, C_{road}\right)$$
