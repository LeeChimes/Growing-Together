import { z } from 'zod';

// Rules document schema
export const RulesDoc = z.object({
  id: z.string().optional(),
  version: z.string(),
  markdown: z.string(),
  published_at: z.string(), // ISO
  summary: z.string().optional(),
  created_by: z.string(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RulesDocT = z.infer<typeof RulesDoc>;

// Rule acknowledgment schema
export const RuleAcknowledgement = z.object({
  id: z.string().optional(),
  rule_id: z.string(),
  user_id: z.string(),
  acknowledged_at: z.string(), // ISO
  created_at: z.string(),
});

export type RuleAcknowledgementT = z.infer<typeof RuleAcknowledgement>;

// Rules form data
export const RulesFormData = z.object({
  version: z.string().min(1, 'Version is required'),
  markdown: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
});

export type RulesFormDataT = z.infer<typeof RulesFormData>;

// Default rules content (starter template)
export const DEFAULT_RULES_MARKDOWN = `# Growing Together Allotment Community Rules

## 1. Plot Use
- Plots must be actively cultivated for growing food or flowers
- No subletting or commercial use of plots
- Keep paths and communal areas clear and accessible
- Notify the secretary if you will be away for extended periods

## 2. Structures and Buildings
- All structures require committee approval before construction
- Maximum shed size: 8ft x 6ft
- Greenhouses and polytunnels must be appropriately sited
- Use appropriate materials - no corrugated iron or unsightly materials

## 3. Compost and Waste
- Green waste only in designated compost areas
- No household rubbish or non-compostable materials
- Dispose of diseased plants appropriately
- Keep compost areas tidy and well-maintained

## 4. Water Usage
- Use water butts and collection systems where possible
- No hoses left running unattended
- Report any leaks or water system issues immediately
- Be considerate of water usage during dry periods

## 5. Fires and BBQs
- Fires only permitted in designated areas
- Follow all fire safety notices and guidelines
- No burning during dry weather warnings
- Ensure fires are completely extinguished before leaving

## 6. Health and Safety
- Store tools and equipment safely
- Children must be supervised at all times
- No glass containers in growing areas
- Report any hazards or safety concerns immediately

## 7. Pets and Animals
- Dogs must be kept on leads at all times
- Clean up after pets immediately
- Pets must not damage other plots or communal areas
- Notify others of any aggressive or problematic animals

## 8. Community and Respect
- Respect your neighbors and their plots
- Quiet hours: 8 PM - 8 AM on weekdays, 8 PM - 9 AM on weekends
- Resolve disputes through committee mediation
- Participate in community events and work days when possible

## 9. Inspections and Plot Removal
- Regular inspections will be conducted by committee members
- Warnings will be issued for non-compliance
- Procedure: Advisory → Warning → Final Warning → Removal
- Appeals process available through committee

## 10. Contact and Emergencies
- Secretary: [Contact details]
- Emergency services: 999
- Report urgent issues to committee members immediately
- Use the community noticeboard for non-urgent communications

---

*These rules are designed to ensure our allotment community remains a pleasant, productive, and safe environment for all members.*

**Last updated:** [Date]  
**Version:** 1.0`;

// Rule section types for structured content
export interface RuleSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

// Parse markdown into sections
export const parseRulesMarkdown = (markdown: string): RuleSection[] => {
  const sections: RuleSection[] = [];
  const lines = markdown.split('\n');
  let currentSection: Partial<RuleSection> | null = null;
  let contentLines: string[] = [];
  let order = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: contentLines.join('\n').trim(),
          order,
        } as RuleSection);
        order++;
      }

      // Start new section
      const title = line.replace('## ', '').trim();
      currentSection = {
        id: title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title,
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      content: contentLines.join('\n').trim(),
      order,
    } as RuleSection);
  }

  return sections;
};

// Generate table of contents
export const generateRulesToC = (sections: RuleSection[]): { title: string; id: string }[] => {
  return sections.map(section => ({
    title: section.title,
    id: section.id,
  }));
};

// Search rules content
export const searchRules = (markdown: string, query: string): { sections: RuleSection[]; highlights: string[] } => {
  const sections = parseRulesMarkdown(markdown);
  const lowerQuery = query.toLowerCase();
  const highlights: string[] = [];
  
  const matchingSections = sections.filter(section => {
    const titleMatch = section.title.toLowerCase().includes(lowerQuery);
    const contentMatch = section.content.toLowerCase().includes(lowerQuery);
    
    if (titleMatch || contentMatch) {
      // Extract highlights from content
      const words = query.split(' ').filter(w => w.length > 2);
      words.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        const matches = section.content.match(regex);
        if (matches) {
          highlights.push(...matches);
        }
      });
      return true;
    }
    
    return false;
  });

  return {
    sections: matchingSections,
    highlights: [...new Set(highlights)], // Remove duplicates
  };
};