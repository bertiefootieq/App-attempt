# Question Suggestion System - Process Documentation

## Overview
The football trivia app includes a comprehensive question suggestion system that allows users to submit questions for admin review and approval. This system ensures quality control while enabling community-driven content expansion.

## User Workflow

### 1. Submitting Questions
**Location:** `/suggest-question` page (accessible via "Suggest Question" in navigation)

**Steps:**
1. User navigates to the suggestion page using the lightbulb icon in the header
2. User fills out the question form with the following information:
   - **Question Text**: The trivia question content
   - **Difficulty**: Easy, Medium, or Hard
   - **Category**: Football topic (e.g., "Premier League", "World Cup")
   - **Question Type**: 
     - Text Input (open answer)
     - Multiple Choice (A, B, C, D options)
   - **Correct Answer**: The right answer to the question
   - **Answer Options** (for multiple choice): Four possible answers
   - **Explanation** (optional): Additional context about the answer

3. User submits the form
4. System creates a suggestion with "pending" status
5. User receives confirmation that their suggestion was submitted for review

### 2. Question Types Supported
- **Text Input Questions**: Allow open-ended answers with acceptable answer variations
- **Multiple Choice Questions**: Four options (A, B, C, D) with one correct answer

## Admin Workflow

### 1. Accessing Admin Panel
**Location:** `/admin` page (requires admin privileges)

**Interface:** Three-tab system:
- **Questions**: Manage existing questions
- **Suggestions**: Review pending submissions (shows notification badge for pending items)
- **Schedule**: Set when questions appear in games

### 2. Reviewing Suggestions
**Location:** Admin Panel > Suggestions Tab

**Process:**
1. Admin sees all question suggestions with status indicators:
   - **Pending**: Awaiting review (highlighted with badge count)
   - **Approved**: Converted to active questions
   - **Rejected**: Declined with review notes

2. For each suggestion, admin can:
   - **View Details**: Question text, answers, category, difficulty, submitter info
   - **Approve**: Convert suggestion to active question in database
   - **Reject**: Decline with mandatory review notes explaining decision

3. **Approval Process:**
   - Click "Approve" button on suggestion
   - Optionally add review notes for feedback
   - System automatically creates new question in database
   - Original suggestion marked as "approved"
   - Submitter receives notification of approval

4. **Rejection Process:**
   - Click "Reject" button on suggestion
   - Required to provide review notes explaining rejection reason
   - Suggestion marked as "rejected"
   - Submitter receives notification with feedback

### 3. Question Scheduling
**Location:** Admin Panel > Schedule Tab

**Features:**
- Set specific dates/times for questions to appear in games
- Schedule questions for live competitions
- Manage question rotation and timing
- Plan themed question sets for special events

**Process:**
1. Select question from approved list
2. Choose scheduling date and time
3. System updates question with scheduled appearance
4. Questions automatically become available at scheduled time

## Technical Implementation

### Database Schema
- **Questions Table**: Active questions available for games
- **Question Suggestions Table**: User submissions awaiting review
- **User Tracking**: Links suggestions to submitters for notifications

### API Endpoints
- `POST /api/question-suggestions` - Submit new suggestion
- `GET /api/question-suggestions` - Fetch suggestions (admin only)
- `POST /api/question-suggestions/:id/approve` - Approve suggestion
- `POST /api/question-suggestions/:id/reject` - Reject suggestion
- `POST /api/questions/:id/schedule` - Schedule question timing

### Security & Permissions
- Only authenticated users can submit suggestions
- Only admin users can access review functionality
- All actions are logged with reviewer ID and timestamps
- Input validation prevents malicious submissions

## Quality Control

### Automatic Validation
- Required fields enforcement
- Character limits for text inputs
- Category standardization
- Answer format validation

### Admin Review Criteria
Admins should evaluate suggestions based on:
- **Accuracy**: Factually correct information
- **Clarity**: Clear, unambiguous question wording
- **Relevance**: Football-related content appropriate for audience
- **Difficulty**: Appropriate for selected difficulty level
- **Uniqueness**: Not duplicate of existing questions

### Review Guidelines
- **Approve** questions that meet quality standards
- **Reject** with constructive feedback for:
  - Factual errors
  - Unclear wording
  - Off-topic content
  - Inappropriate difficulty level
  - Duplicate content

## Notification System
- Users receive feedback on suggestion status changes
- Admins get alerts for new pending suggestions
- Badge counters show pending review items
- Toast notifications confirm actions

## Workflow Benefits
1. **Community Engagement**: Users contribute to content growth
2. **Quality Assurance**: Admin review ensures content standards
3. **Scalable Content**: Automated system handles high submission volumes
4. **Feedback Loop**: Users receive constructive feedback on submissions
5. **Flexible Scheduling**: Admins control when content appears
6. **Audit Trail**: Complete history of submissions and reviews

## Best Practices

### For Users
- Research questions for accuracy before submitting
- Provide clear, concise question wording
- Include helpful explanations for educational value
- Choose appropriate difficulty levels

### For Admins
- Review suggestions promptly to maintain user engagement
- Provide constructive feedback in rejection notes
- Maintain consistent quality standards
- Use scheduling feature for strategic content planning
- Monitor submission patterns to identify quality contributors

## Troubleshooting

### Common Issues
- **Suggestion not appearing**: Check if form validation passed
- **Admin panel not accessible**: Verify admin privileges
- **Approval/rejection not working**: Ensure proper authentication
- **Scheduling conflicts**: Check for overlapping scheduled times

### Error Handling
- Form validation prevents invalid submissions
- API errors display user-friendly messages
- Failed operations show retry options
- System logs capture technical issues for debugging

This comprehensive system ensures high-quality, community-driven content growth while maintaining editorial control and user engagement.