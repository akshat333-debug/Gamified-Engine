"""
PDF Generation Service - Creates professional Program Design Documents
"""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


class PDFService:
    """Service for generating Program Design Document PDFs."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._add_custom_styles()
    
    def _add_custom_styles(self):
        """Add custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='DocTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1a365d')
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceBefore=20,
            spaceAfter=12,
            textColor=colors.HexColor('#2d3748')
        ))
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceBefore=12,
            spaceAfter=8,
            textColor=colors.HexColor('#4a5568')
        ))
        self.styles.add(ParagraphStyle(
            name='DocBody',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            leading=16
        ))
    
    def generate_program_document(
        self,
        program_title: str,
        problem_statement: dict,
        stakeholders: list,
        proven_models: list,
        outcomes: list,
        indicators: list
    ) -> bytes:
        """Generate a complete program design document PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        
        # Title Page
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Program Design Document", self.styles['DocTitle']))
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(program_title, self.styles['SectionHeader']))
        story.append(Spacer(1, 1*inch))
        story.append(Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y')}",
            self.styles['DocBody']
        ))
        story.append(Paragraph(
            "Created with LogicForge",
            self.styles['DocBody']
        ))
        story.append(PageBreak())
        
        # Table of Contents
        story.append(Paragraph("Table of Contents", self.styles['SectionHeader']))
        toc_items = [
            "1. Challenge Statement & Root Cause Analysis",
            "2. Stakeholder Mapping",
            "3. Evidence-Based Interventions",
            "4. Outcomes & Indicators",
            "5. Monitoring Framework"
        ]
        for item in toc_items:
            story.append(Paragraph(item, self.styles['DocBody']))
        story.append(PageBreak())
        
        # Section 1: Problem Statement
        story.append(Paragraph("1. Challenge Statement & Root Cause Analysis", self.styles['SectionHeader']))
        
        if problem_statement:
            story.append(Paragraph("Challenge Statement", self.styles['SubHeader']))
            story.append(Paragraph(
                problem_statement.get('challenge_text', 'Not provided'),
                self.styles['DocBody']
            ))
            
            if problem_statement.get('refined_text'):
                story.append(Paragraph("Refined Problem Statement", self.styles['SubHeader']))
                story.append(Paragraph(
                    problem_statement['refined_text'],
                    self.styles['DocBody']
                ))
            
            root_causes = problem_statement.get('root_causes', [])
            if root_causes:
                story.append(Paragraph("Root Causes", self.styles['SubHeader']))
                for i, cause in enumerate(root_causes, 1):
                    story.append(Paragraph(f"{i}. {cause}", self.styles['DocBody']))
            
            if problem_statement.get('theme'):
                story.append(Paragraph(
                    f"<b>Theme:</b> {problem_statement['theme']}",
                    self.styles['DocBody']
                ))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Section 2: Stakeholders
        story.append(Paragraph("2. Stakeholder Mapping", self.styles['SectionHeader']))
        
        if stakeholders:
            stakeholder_data = [['Stakeholder', 'Role', 'Engagement Strategy', 'Priority']]
            for s in stakeholders:
                stakeholder_data.append([
                    s.get('name', ''),
                    s.get('role', ''),
                    s.get('engagement_strategy', '')[:50] + '...' if s.get('engagement_strategy', '') and len(s.get('engagement_strategy', '')) > 50 else s.get('engagement_strategy', ''),
                    s.get('priority', 'medium').capitalize()
                ])
            
            stakeholder_table = Table(stakeholder_data, colWidths=[1.5*inch, 1.5*inch, 2.5*inch, 0.8*inch])
            stakeholder_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(stakeholder_table)
        else:
            story.append(Paragraph("No stakeholders defined.", self.styles['DocBody']))
        
        story.append(Spacer(1, 0.5*inch))
        
        # Section 3: Proven Models
        story.append(Paragraph("3. Evidence-Based Interventions", self.styles['SectionHeader']))
        
        if proven_models:
            for model in proven_models:
                story.append(Paragraph(f"<b>{model.get('name', 'Unnamed Model')}</b>", self.styles['SubHeader']))
                story.append(Paragraph(model.get('description', ''), self.styles['DocBody']))
                
                if model.get('evidence_base'):
                    story.append(Paragraph(
                        f"<i>Evidence Base:</i> {model['evidence_base']}",
                        self.styles['DocBody']
                    ))
                story.append(Spacer(1, 0.2*inch))
        else:
            story.append(Paragraph("No proven models selected.", self.styles['DocBody']))
        
        story.append(PageBreak())
        
        # Section 4: Outcomes & Indicators
        story.append(Paragraph("4. Outcomes & Indicators", self.styles['SectionHeader']))
        
        if outcomes:
            for outcome in outcomes:
                story.append(Paragraph(
                    f"<b>Outcome:</b> {outcome.get('description', '')}",
                    self.styles['SubHeader']
                ))
                
                outcome_id = outcome.get('id')
                outcome_indicators = [i for i in indicators if i.get('outcome_id') == outcome_id]
                
                if outcome_indicators:
                    indicator_data = [['Type', 'Indicator', 'Target', 'Frequency']]
                    for ind in outcome_indicators:
                        indicator_data.append([
                            ind.get('type', '').capitalize(),
                            ind.get('description', '')[:60] + '...' if len(ind.get('description', '')) > 60 else ind.get('description', ''),
                            ind.get('target_value', ''),
                            ind.get('frequency', '')
                        ])
                    
                    indicator_table = Table(indicator_data, colWidths=[0.8*inch, 3.5*inch, 1.2*inch, 0.8*inch])
                    indicator_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ]))
                    story.append(indicator_table)
                story.append(Spacer(1, 0.3*inch))
        else:
            story.append(Paragraph("No outcomes defined.", self.styles['DocBody']))
        
        # Build PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes


# Singleton instance
pdf_service = PDFService()


def get_pdf_service() -> PDFService:
    return pdf_service
