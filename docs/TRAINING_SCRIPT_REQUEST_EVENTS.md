# Training Script: Creating Events Using Request Events

## Pre-Recording Setup
- [ ] Ensure development server is running on localhost:9002
- [ ] Have sample club data available
- [ ] Clear browser cache/cookies for clean session
- [ ] Prepare sample event information (see below)
- [ ] Test audio/video recording setup

## Sample Event Data for Training
Use these realistic examples during the recording:

### Event 1: Zone Rally
- **Event Name:** "Central Zone Spring Rally"
- **Event Type:** "Rally"
- **Date:** [Select a date 3-4 months in the future]
- **Location:** Will auto-populate with club address
- **Coordinator:** "Sarah Mitchell"
- **Contact:** "sarah.mitchell@email.com"
- **Description:** "Annual spring rally featuring dressage, showjumping, and games competitions"
- **Priority:** 1
- **Qualifier:** Yes
- **Historical:** No

### Event 2: Training Day
- **Event Name:** "Beginner Rider Safety Workshop"
- **Event Type:** "Training"
- **Date:** [Select a date 2 months in the future]
- **Location:** Will auto-populate, then edit to add "Indoor Arena"
- **Coordinator:** "Mark Thompson"
- **Contact:** "0412 345 678"
- **Description:** "Essential safety skills for new riders including mounting, dismounting, and emergency procedures"
- **Priority:** 2
- **Qualifier:** No
- **Historical:** No

### Event 3: Traditional Event
- **Event Name:** "Annual Christmas Party"
- **Event Type:** "Social"
- **Date:** [December date]
- **Location:** Edit to "Club House and Main Arena"
- **Coordinator:** "Jenny Wilson"
- **Contact:** "jenny.wilson@club.com"
- **Description:** "Traditional end-of-year celebration with games, prizes, and festive activities"
- **Priority:** 3
- **Qualifier:** No
- **Historical:** Yes (explain this is traditionally held each December)

---

## Recording Script

### Opening (30 seconds)
**[Screen: Browser with localhost:9002 home page]**

"Welcome to this training session on creating events using the Request Events feature in the Pony Club Event Manager. 

In this tutorial, we'll walk through the complete process of submitting event requests, from initial form completion to final submission. This system allows club members to request multiple events simultaneously, with automatic priority ranking and comprehensive validation."

### Navigation to Request Events (45 seconds)
**[Action: Navigate to Request Events]**

"Let's start by navigating to the Request Events page. I'll click on 'Request Event' in the main navigation menu."

**[Screen: Request Events page loads]**

"Here we can see the Request Events form. This is where club members can submit requests for up to 4 events at once. The system automatically handles priority ranking, ensures all required information is captured, and provides helpful validation throughout the process."

### Form Overview (1 minute)
**[Action: Scroll through form to show sections]**

"Let's take a quick overview of the form structure. The form has several key sections:

1. **Club Selection** - Where we choose which club the events are for
2. **Submitter Information** - Contact details for the person making the request
3. **Event Details** - Individual event information with automatic priority assignment
4. **Policy Information** - Important guidelines displayed on the right side

Notice the policy panel on the right - this provides important context about event submission rules, deadlines, and approval processes."

### Club Selection (1.5 minutes)
**[Action: Click in club search field]**

"First, let's select our club. I'll start typing in the club search field..."

**[Action: Type partial club name, show autocomplete]**

"As I type, the system provides autocomplete suggestions. This makes it easy to find your club even if you're not sure of the exact spelling. I can see several clubs matching my search."

**[Action: Select a club from dropdown]**

"I'll select 'Riverside Pony Club' from the dropdown. Notice that when I select the club, it automatically populates the zone information as well - 'Central Zone' appears automatically because the system knows which zone this club belongs to."

### Submitter Information with Autocomplete (2 minutes)
**[Action: Click in Name field and start typing]**

"Now I need to enter my contact information as the person submitting this request. When I start typing in the name field..."

**[Action: Type a name that will trigger autocomplete, e.g., "Joseph"]**

"The system provides autocomplete suggestions based on existing users in the database. This is particularly helpful for club officials who frequently submit requests. I can see 'Joseph Christenson' appears as a suggestion."

**[Action: Click on autocomplete suggestion]**

"When I select the suggested name, watch what happens - the system automatically populates the email and phone fields with the stored information for this person. This saves time and ensures consistency in contact information."

**[Show the populated fields]**

"Perfect! The email 'joseph@example.com' and phone number have been automatically filled in. Of course, I can edit these fields if the information needs to be updated."

### Adding First Event (3 minutes)
**[Action: Scroll to event section]**

"Now let's add our first event. The form starts with one event slot, automatically assigned Priority 1. Let me fill in the details for our Zone Rally."

**[Action: Fill in event name]**

"Event name: 'Central Zone Spring Rally'"

**[Action: Click event type dropdown]**

"For event type, I'll click the dropdown to see available options. The system provides a comprehensive list of event types including Rally, Training, Competition, Social events, and more. I'll select 'Rally'."

**[Action: Select Rally from dropdown]**

**[Action: Click date picker]**

"For the date, I'll click the date picker. The system prevents selecting dates in the past - notice how past dates are grayed out. I'll select a date about 3 months from now."

**[Action: Select future date]**

**[Action: Show location field]**

"Here's a great feature - notice that the location field has been automatically populated with the club's address: 'Riverside Pony Club, 123 Country Road, Riverside, NSW 2444'. This saves time since most events are held at the club location, but I can edit this if the event is at a different venue."

**[Action: Fill in coordinator information]**

"I'll add the coordinator information - Sarah Mitchell, and her email address."

**[Action: Fill in description]**

"In the description field, I'll add details about what this event involves."

**[Action: Check the Qualifier checkbox]**

"Since this is a Zone Rally, it's typically a qualifier event, so I'll check the 'This is a Zone Qualifier Event' checkbox."

"Notice that the Historical checkbox is unchecked - this would be used for events that are traditionally held on specific dates each year."

### Adding Second Event (2.5 minutes)
**[Action: Click Add Event button]**

"Now let's add a second event by clicking the 'Add Event' button."

**[Action: Show new event form appears]**

"Great! A second event form appears, automatically assigned Priority 2. Notice how the location field is again pre-populated with the club address - the system remembers our club selection."

**[Action: Fill in training event details]**

"For our second event, I'll create a training session:
- Event Name: 'Beginner Rider Safety Workshop'
- Event Type: I'll select 'Training' from the dropdown
- Date: I'll pick a date about 2 months out"

**[Action: Edit location field]**

"For this training session, I want to specify it's in the indoor arena, so I'll edit the location to add 'Indoor Arena' to the existing address."

**[Action: Complete coordinator and description fields]**

"Coordinator: Mark Thompson, phone number, and a description of the safety workshop."

"Notice this isn't a qualifier event, so I'll leave that checkbox unchecked, and it's not a historical event either."

### Adding Third Event - Historical Event (2.5 minutes)
**[Action: Add third event]**

"Let's add one more event to demonstrate the historical event feature. I'll click 'Add Event' again."

**[Action: Fill in Christmas party details]**

"For our third event, I'll create the annual Christmas party:
- Event Name: 'Annual Christmas Party'
- Event Type: 'Social'
- Date: I'll select a date in December"

**[Action: Edit location creatively]**

"For location, I'll edit this to specify 'Club House and Main Arena' since the party will use multiple areas."

**[Action: Check Historical event checkbox]**

"Here's the key feature - I'll check the 'Historically traditional event' checkbox. This indicates that this Christmas party is held every year around the same time. The system uses this information to help with scheduling and conflict detection."

**[Action: Complete remaining fields]**

"I'll add Jenny Wilson as coordinator and describe the traditional end-of-year celebration."

### Form Validation and Review (2 minutes)
**[Action: Scroll through completed form]**

"Before submitting, let's review what we've created. Notice how the system has automatically assigned priorities 1, 2, and 3 to our events. The validation ensures:

1. All required fields are completed
2. Each event has a unique priority
3. Priorities are consecutive (1, 2, 3)
4. Contact information is provided
5. Event dates are in the future"

**[Action: Show any validation messages if fields are incomplete]**

"If any required information is missing, the system will highlight those fields and prevent submission until they're completed."

### Policy Panel Review (1 minute)
**[Action: Point out policy panel]**

"Before submitting, it's important to review the policy information shown here. This panel explains:
- Event submission deadlines
- Approval processes
- Priority guidelines
- Contact information for questions

These policies help ensure requests are submitted correctly and processed efficiently."

### Submission Process (1.5 minutes)
**[Action: Click Submit Request button]**

"Now I'm ready to submit our request. I'll click 'Submit Event Request'."

**[Action: Show processing/loading state]**

"The system processes the submission - you can see the loading indicator."

**[Action: Show success message or confirmation]**

"Excellent! The system confirms our request has been submitted successfully. The events are now in the system for review and approval by the appropriate zone representatives."

### Post-Submission Features (1 minute)
**[Action: Show PDF generation or confirmation details if available]**

"After submission, the system typically provides:
- A confirmation reference number
- Email confirmation to the submitter
- PDF copy of the request for records
- Information about next steps in the approval process"

### Key Benefits Summary (1 minute)
**[Action: Return to clean form or navigate to showcase features]**

"Let me summarize the key benefits of the Request Events system:

1. **Batch Submission**: Submit up to 4 events at once with automatic priority ranking
2. **Smart Autocomplete**: User information and club details are automatically populated
3. **Location Intelligence**: Club addresses are automatically filled in but can be customized
4. **Validation**: Comprehensive validation ensures complete, accurate submissions
5. **Historical Tracking**: Mark traditional events for better scheduling
6. **Policy Integration**: Important guidelines are always visible
7. **Streamlined Process**: Single form replaces multiple separate submissions"

### Troubleshooting Tips (1 minute)
"A few quick tips for successful event requests:

- **Club Selection**: Make sure to select the correct club first - this affects location auto-population and routing
- **Event Types**: Choose the most specific event type available for better categorization
- **Coordinator Contact**: Provide current, accurate contact information - this is how approvers will reach out
- **Descriptions**: Include enough detail for approvers to understand the event scope
- **Historical Events**: Only mark events as historical if they're truly traditional annual events
- **Priority Order**: Remember that Priority 1 is your most important event - the system processes them in priority order"

### Closing (30 seconds)
"That completes our training on creating events using the Request Events feature. This system streamlines the event submission process while ensuring all necessary information is captured and validated.

For additional support or questions about event submissions, refer to the policy information panel or contact your zone representatives using the contact details provided in the system.

Thank you for watching, and happy event planning!"

---

## Post-Recording Checklist
- [ ] Review recording for audio/video quality
- [ ] Check that all key features were demonstrated
- [ ] Verify timestamps align with script sections
- [ ] Add captions if required
- [ ] Test final video with target audience
- [ ] Upload to appropriate training platform
- [ ] Update training documentation with video link

## Additional Notes for Trainer

### Technical Notes:
- Ensure stable internet connection for API calls
- Have backup sample data ready
- Test form submission in advance
- Be prepared for potential loading delays

### Presentation Tips:
- Speak clearly and at moderate pace
- Use mouse cursor to highlight important areas
- Allow time for system responses/loading
- Explain any unexpected behavior calmly

### Common Issues to Address:
- What to do if autocomplete doesn't find your name
- How to handle club selection errors
- What happens if submission fails
- How to modify events after adding them

This script provides approximately 15-18 minutes of content, ideal for a comprehensive training video that covers all aspects of the Request Events feature while maintaining viewer engagement.