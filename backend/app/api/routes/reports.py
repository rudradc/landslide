import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.database import get_db
from app.models.entities import Habitation, RelocationSite
from app.services.relocation_engine import rank_relocation_sites

router = APIRouter()

@router.get("/risk/{habitation_id}")
def generate_pdf_risk_report(habitation_id: str, db: Session = Depends(get_db)):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=12
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # Title & Header
    story.append(Paragraph("DISASTER RISK & RELOCATION DECISION SUPPORT SYSTEM", subtitle_style))
    story.append(Paragraph(f"Official Analytical Risk Report: {hab.name}", title_style))
    story.append(Paragraph(f"Habitation Code: {hab.habitation_code} | District: {hab.district}, {hab.state} | Generated on: 2026-09-05", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=12))

    # Executive Summary Card Table
    risk_score = hab.risk.overall_risk_score if hab.risk else 0.0
    risk_cat = hab.risk.risk_category if hab.risk else "Low"
    priority_score = hab.priority.priority_score if hab.priority else 0.0
    priority_cat = hab.priority.priority_category if hab.priority else "Low Priority"
    overcap = hab.capacity.overcapacity_count if hab.capacity else 0

    summary_data = [
        ["Overall Risk Score", "Risk Category", "Relocation Priority", "Overcapacity Population"],
        [f"{risk_score} / 100", risk_cat.upper(), f"{priority_score} / 100", f"{overcap} Persons"]
    ]

    summary_table = Table(summary_data, colWidths=[130, 130, 150, 130])
    cat_color = colors.HexColor("#DC2626") if risk_cat == "Critical" else (colors.HexColor("#EA580C") if risk_cat == "High" else colors.HexColor("#D97706"))
    
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TEXTCOLOR', (1, 1), (1, 1), cat_color),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 1. Geographic & Demographic Profile
    story.append(Paragraph("1. Geographic & Demographic Profile", h2_style))
    profile_data = [
        ["Attribute", "Value", "Attribute", "Value"],
        ["Latitude", f"{hab.latitude:.4f}° N", "Population", f"{hab.population:,}"],
        ["Longitude", f"{hab.longitude:.4f}° E", "Households", f"{hab.households:,}"],
        ["Elevation", f"{hab.elevation_m} m", "Area (sq km)", f"{hab.area_sq_km} sq km"],
        ["Slope Angle", f"{hab.slope_deg}°", "Soil Type", f"{hab.soil_type}"],
        ["Annual Rainfall", f"{hab.annual_rainfall_mm} mm", "Dist. to River", f"{hab.distance_to_river_m} m"]
    ]
    p_table = Table(profile_data, colWidths=[130, 140, 130, 140])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 10))

    # 2. Risk Assessment & Contributing Factors Breakdown
    story.append(Paragraph("2. Hazard, Vulnerability & Carrying Capacity Breakdown", h2_style))
    h_score = hab.hazard.composite_hazard_score if hab.hazard else 0.0
    v_score = hab.vulnerability.composite_vulnerability_score if hab.vulnerability else 0.0
    cp_score = hab.capacity.capacity_pressure_score if hab.capacity else 0.0
    safe_cap = hab.capacity.safe_estimated_capacity if hab.capacity else 0
    bottleneck = hab.capacity.bottleneck_resource if hab.capacity else "N/A"

    risk_breakdown = [
        ["Sub-Assessment", "Score (0-100)", "Key Diagnostic Metric"],
        ["Composite Hazard", f"{h_score}", f"Landslide: {hab.hazard.landslide_score if hab.hazard else 0} | Flood: {hab.hazard.flood_score if hab.hazard else 0}"],
        ["Composite Vulnerability", f"{v_score}", f"Social Density & Accessibility: Hospital {hab.distance_to_hospital_m}m"],
        ["Capacity Pressure", f"{cp_score}", f"Safe Capacity: {safe_cap} persons | Primary Bottleneck: {bottleneck}"]
    ]
    r_table = Table(risk_breakdown, colWidths=[150, 100, 290])
    r_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(r_table)
    story.append(Spacer(1, 10))

    # 3. Candidate Relocation Sites Ranking
    story.append(Paragraph("3. Ranked Candidate Relocation Target Sites", h2_style))
    all_sites = db.query(RelocationSite).all()
    if all_sites:
        sites_dicts = [s.__dict__ for s in all_sites]
        ranked = rank_relocation_sites(hab.__dict__, sites_dicts)[:3]  # Top 3 candidates

        reco_data = [["Rank", "Site Name", "District", "Suitability Score", "Suitability Tier", "Distance"]]
        for r in ranked:
            reco_data.append([
                f"#{r['rank_order']}",
                r["site"]["name"],
                r["site"]["district"],
                f"{r['suitability_score']} / 100",
                r["suitability_tier"],
                f"{r['rationale']['distance_km']} km"
            ])
        reco_table = Table(reco_data, colWidths=[40, 130, 90, 100, 110, 70])
        reco_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EFF6FF")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BFDBFE")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(reco_table)
    else:
        story.append(Paragraph("No candidate relocation target sites registered in database.", normal_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94A3B8"), spaceAfter=8))
    
    disclaimer = Paragraph(
        "<b>DECISION-SUPPORT NOTICE:</b> This document is generated by an AI & GIS Decision Support System. "
        "Outputs provide analytical risk prioritization and candidate site recommendations. Final relocation directives "
        "and land-use decisions MUST be validated by qualified disaster management authorities and on-site geological field assessments.",
        ParagraphStyle('Disclaimer', parent=normal_style, fontSize=7.5, leading=10, textColor=colors.HexColor("#64748B"))
    )
    story.append(disclaimer)

    doc.build(story)
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Risk_Report_{hab.habitation_code}.pdf"}
    )
