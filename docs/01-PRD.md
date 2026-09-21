# Make My Marriage
## Product Requirements Document — v1.0

**Product Type:** Consumer SaaS Web Application  
**Market:** Indian Hindu Weddings  
**Business Model:** Freemium  
**Initial Platform:** Responsive Web Application  
**Document Status:** Initial Product Scope  
**Version:** 1.0

---

# 1. Product Overview

## 1.1 Product Name

**Make My Marriage**

## 1.2 Product Vision

Make My Marriage is a collaborative wedding planning platform designed specifically for Indian Hindu weddings.

The product provides one shared digital workspace where couples, their families, and organisers can collaboratively plan and manage the wedding before the wedding takes place.

The platform brings together:

- Wedding ceremonies
- Tasks
- Organisers
- Guests
- Vendors
- Expenses
- Documents
- Invitations
- RSVP
- Wedding website
- Gallery
- Guest uploads
- Digital guestbook
- Livestream
- Emergency contacts

The product should reduce dependence on disconnected spreadsheets, WhatsApp conversations, notebooks, shared documents, and verbal coordination between family members.

---

# 2. Product Positioning

Make My Marriage is not primarily:

- A vendor marketplace
- A wedding planner CRM
- An accounting application
- A hotel/logistics platform
- A social network
- An AI wedding planner
- A wedding-day command centre

Instead, it is:

> **A shared wedding planning workspace for Indian Hindu couples, families, and organisers.**

The main product promise is:

> **Plan your entire wedding together, from one place.**

---

# 3. Problem Statement

Planning an Indian Hindu wedding generally involves multiple ceremonies, multiple vendors, hundreds of guests, many expenses, documents, payments, and a large group of family members responsible for different activities.

Wedding information frequently becomes fragmented across:

- WhatsApp groups
- Excel sheets
- Google Sheets
- Notes
- Phone calls
- Family members
- Vendor invoices
- Email conversations
- Physical documents

This creates problems such as:

- Tasks being forgotten
- Duplicate responsibilities
- Missed vendor payments
- Confusion about who is managing what
- Guest lists becoming inconsistent
- Expenses being difficult to track
- Wedding documents being scattered
- Important information being unavailable to other organisers
- Difficult collaboration between the bride's and groom's families

Make My Marriage aims to centralise this planning process.

---

# 4. Product Goals

The first version should accomplish five primary goals.

## Goal 1 — Centralise wedding planning

Users should be able to manage most important wedding-planning information without switching between multiple tools.

## Goal 2 — Enable family collaboration

Multiple people should be able to work on the same wedding while maintaining appropriate access permissions.

## Goal 3 — Simplify multi-event planning

Users should be able to manage all major Hindu wedding ceremonies under one wedding.

## Goal 4 — Give organisers visibility

The wedding dashboard should immediately answer:

- What needs to be done?
- Who is responsible?
- What is overdue?
- How much has been spent?
- What payments are outstanding?
- How many guests are attending?
- What events are upcoming?

## Goal 5 — Give the wedding a digital presence

The couple should be able to publish a customizable wedding website containing wedding information, invitations, media, guest wishes, and livestream access.

---

# 5. Non-Goals

The following are explicitly outside the initial product scope.

Make My Marriage will not initially provide:

- Vendor discovery marketplace
- Vendor bidding
- Vendor quotation comparison
- Vendor accounts
- AI wedding planning
- Generative AI
- Face recognition
- AI photo discovery
- Hotel room allocation
- Flight management
- Train management
- Airport pickup management
- Shuttle management
- Vehicle fleet management
- Seating charts
- Dietary preference management
- QR guest check-in
- Guest user accounts
- WhatsApp API automation
- Complex accounting
- Expense settlements between families
- Multi-level financial approvals
- Planner agency CRM
- Lead/customer management
- Native Android application
- Native iOS application
- Custom wedding domains
- Internal messaging/chat application
- Proprietary livestream infrastructure
- Detailed wedding-day run-of-show management

These features may be reconsidered after product-market validation.

---

# 6. Target Users

There are four major user groups.

## 6.1 Couple

Examples:

- Bride
- Groom

Typical responsibilities:

- Overall wedding visibility
- Event creation
- Task management
- Guest planning
- Website customization
- Vendor management
- Expense visibility
- Gallery management

---

# 6.2 Family Members

Examples:

- Bride's parents
- Groom's parents
- Siblings
- Cousins
- Close relatives

Typical responsibilities:

- Guest management
- Vendor coordination
- Financial tracking
- Ceremony-specific responsibilities
- Invitations
- Tasks

---

# 6.3 Organisers

Examples:

- Friend coordinating Sangeet
- Relative coordinating Haldi
- Family-appointed coordinator
- External wedding coordinator

Organisers may only have responsibility for selected ceremonies or functional areas.

---

# 6.4 Guests

Guests are external users.

Guests do not create Make My Marriage accounts.

They interact through wedding/invitation URLs.

Guests can potentially:

- View the wedding website
- See ceremonies
- View venue information
- RSVP
- Access approved galleries
- Upload photos/videos
- Leave guestbook wishes
- Watch the livestream

---

# 7. Account Model

A registered user may belong to multiple weddings.

Example:

A person may:

- Manage their own wedding
- Be invited to their sibling's wedding
- Help manage a cousin's wedding

The account should therefore provide a:

**Wedding Switcher**

However, the product will not provide a professional agency dashboard designed for simultaneously managing dozens of client weddings.

---

# 8. Wedding Workspace

Every wedding receives an independent workspace.

A wedding workspace contains:

- Wedding profile
- Events
- Team
- Tasks
- Guests
- Vendors
- Expenses
- Documents
- Website
- Gallery
- Guestbook
- Livestream
- Emergency contacts
- Notifications
- Activity history

Information belonging to one wedding must never appear in another wedding.

---

# 9. User Roles

The platform will initially support three internal wedding roles.

## 9.1 Admin

Admin has full access to the wedding.

Admin can additionally:

- Invite team members
- Remove team members
- Change team member roles
- Configure permissions
- Manage wedding ownership

Admin is the only role with team-management privileges.

---

## 9.2 Manager

Manager can manage wedding information based on granted permissions.

A Manager does not automatically receive the ability to manage team members.

---

## 9.3 Organiser

Organiser can manage wedding information based on granted permissions.

An Organiser may be restricted to selected events or functional areas.

---

# 10. Permission Model

All internal users should see essentially the same product interface.

The product should follow:

> **Same dashboard, different access.**

Instead of designing completely separate interfaces for Admins, Managers, and Organisers, the platform will control which actions and information each person can access.

## Permissions

A Manager or Organiser can potentially receive:

- All-event access
- Selected-event access
- Guest management
- Vendor management
- Expense/finance access
- Gallery management
- Website management
- Guestbook management
- Emergency contact management

Admin always has full access.

---

# 11. Wedding Creation

A new user should be able to create a wedding through a guided onboarding flow.

Required information:

- Bride name
- Groom name
- Primary wedding date
- Primary wedding city/location
- Wedding title
- Preferred language

Optional:

- Cover image
- Couple photograph

After creation, the platform should guide the user toward:

1. Adding events
2. Generating wedding checklist
3. Inviting organisers
4. Adding guests
5. Adding vendors
6. Setting up the wedding website

---

# 12. Wedding Dashboard

The Wedding Dashboard is the default landing page after entering a wedding.

It should provide an immediate high-level view of wedding planning.

## Dashboard information

### Wedding header

- Couple names
- Wedding cover
- Main wedding date
- Countdown

Example:

**Aarav ❤️ Meera**

**62 Days to Go**

---

## Event summary

Display:

- Number of ceremonies
- Next ceremony
- Upcoming ceremonies

---

## Task summary

Display:

- Total tasks
- Completed
- In progress
- Overdue
- Due soon

Example:

**32 / 47 Tasks Complete**

---

## Guest summary

Display:

- Households invited
- Total invited people
- Attending
- Not attending
- Awaiting RSVP

---

## Expense summary

Display:

- Total expenses
- Total paid
- Outstanding
- Payments due soon
- Overdue payments

---

## Vendor summary

Display:

- Total vendors
- Vendors with pending payments
- Upcoming payment deadlines

---

## Dashboard alerts

Examples:

- 7 overdue tasks
- Photographer payment due tomorrow
- 18 families have not responded
- 3 invoices need review
- New guest photo uploads awaiting approval

---

## Quick actions

Dashboard should provide actions such as:

- Add Event
- Add Task
- Add Guest
- Add Vendor
- Add Expense
- Upload Document

---

# 13. Event Management

One wedding contains multiple ceremonies/events.

## Default event suggestions

The product should suggest common Hindu wedding events such as:

- Roka
- Engagement
- Tilak
- Mehendi
- Haldi
- Sangeet
- Wedding
- Pheras
- Reception

Users must also be able to create:

**Custom Event**

The product must not assume that every Hindu wedding follows exactly the same ceremonies.

---

## Event fields

Each event should support:

- Event name
- Description
- Date
- Start time
- End time
- Venue
- Venue address
- Google Maps URL
- Dress code
- Cover image
- Notes

---

## Event relationships

An event may have:

- Organisers
- Tasks
- Vendors
- Expenses
- Documents

---

# 14. Team Management

Admins can invite additional wedding collaborators.

Team member information:

- Name
- Email
- Role
- Assigned events
- Permissions
- Invitation status

Invitation statuses:

- Invited
- Accepted
- Expired

Admin actions:

- Invite
- Resend invitation
- Change role
- Change access
- Remove member

---

# 15. Task Management

Task management is a core product feature.

## Task fields

A task contains:

- Title
- Description
- Event
- Assigned user
- Created by
- Due date
- Priority
- Status
- Subtasks
- Dependencies
- Attachments
- Comments
- Reminder

---

## Task priority

Possible values:

- Low
- Medium
- High

---

## Task status

Possible values:

- To Do
- In Progress
- Completed

---

## Task views

Users should have:

### All Tasks

Every task the user is permitted to see.

### My Tasks

Tasks assigned to the current user.

### Event Tasks

Tasks belonging to a selected ceremony.

### Overdue

Incomplete tasks past their due date.

### Upcoming

Tasks approaching their deadline.

### Completed

Completed tasks.

---

## Task presentation

Support at minimum:

**List View**

A board-style view may additionally support:

**To Do → In Progress → Completed**

---

# 16. Task Comments

Users should be able to collaborate directly inside tasks.

Comments should support:

- Text
- Timestamp
- Author
- Attachments

Optional mention support:

`@username`

Users should receive a notification when mentioned.

---

# 17. Hindu Wedding Checklist

The system should provide a predefined Hindu wedding planning checklist.

The checklist should create suggested tasks automatically.

Categories may include:

## Venue

- Shortlist venue
- Finalise venue
- Pay venue advance
- Confirm venue timings

## Catering

- Finalise caterer
- Finalise menu
- Confirm guest estimate
- Pay advance

## Photography

- Finalise photographer
- Sign agreement
- Pay advance
- Confirm event schedule

## Decoration

- Finalise decorator
- Approve decoration concept
- Pay advance

## Wedding Ceremony

- Confirm pandit
- Confirm ceremony timing
- Arrange pooja materials
- Arrange varmala
- Arrange mandap requirements

## Invitations

- Prepare guest list
- Finalise invitation
- Send invitations
- Follow up on RSVP

## Clothing

- Bride outfits
- Groom outfits
- Family outfits
- Alterations

Users can:

- Keep suggested tasks
- Modify suggested tasks
- Delete suggested tasks
- Assign tasks
- Add custom tasks

No AI is required.

---

# 18. Expense Management

Expense management should remain simple.

The system is not intended to become professional accounting software.

## Expense fields

An expense should contain:

- Expense title
- Category
- Event
- Vendor
- Total amount
- Notes
- Documents
- Created by
- Created date

---

# 19. Expense Categories

Default categories may include:

- Venue
- Catering
- Decoration
- Photography
- Makeup
- Clothing
- Jewellery
- Entertainment
- Invitation
- Gifts
- Ceremony
- Transport
- Miscellaneous

Users may additionally use:

**Other**

---

# 20. Payment Tracking

Each expense can contain one or more payment records.

Example:

**Decorator**

Total: ₹2,00,000

Payment 1  
₹50,000  
Advance  
Paid

Payment 2  
₹75,000  
Due 15 November  
Pending

Payment 3  
₹75,000  
Due 20 November  
Pending

---

## Payment fields

- Amount
- Due date
- Payment status
- Payment date
- Paid by
- Payment method
- Notes
- Receipt

---

## Payment status

- Pending
- Paid
- Overdue

The system should automatically classify unpaid payments past their due date as overdue.

---

# 21. Who Paid

Payments can record who paid the amount.

Examples:

- Bride
- Groom
- Bride's father
- Groom's father
- Other family member

The system should allow payment summaries by payer.

Example:

Bride's family: ₹5,50,000  
Groom's family: ₹4,75,000  
Couple: ₹2,20,000

This information is informational only.

The platform does not calculate settlement obligations.

---

# 22. Expense Approval

Approval will remain intentionally simple.

Possible states:

- Pending
- Approved
- Rejected

Only one approval step should exist.

There will be no multi-person or sequential approval workflow.

Users with the relevant permission can perform approval.

---

# 23. Vendor Management

The platform stores vendors selected by the family.

It does not help discover vendors.

## Vendor information

- Business name
- Vendor category
- Contact person
- Phone
- Email
- Address
- Website
- Social profile
- Notes
- Related events
- Agreed amount
- Payment status

---

## Vendor categories

Examples:

- Venue
- Caterer
- Photographer
- Videographer
- Decorator
- DJ
- Choreographer
- Makeup artist
- Mehendi artist
- Pandit
- Invitation designer
- Entertainment
- Other

---

# 24. Vendor Documents

Internal wedding users can upload vendor-related documents.

Examples:

- Quotation
- Invoice
- Contract
- Receipt
- Menu
- Decoration proposal
- Agreement
- Reference images

Vendors do not receive accounts.

---

# 25. Guest Management

Guests should primarily be organised by:

**Household / Family**

rather than only individual people.

Example:

**Sharma Family**

Members:

- Rahul Sharma
- Neha Sharma
- Aarav Sharma
- Riya Sharma

---

# 26. Household Fields

Each household should support:

- Family/household name
- Primary contact name
- Phone
- Email
- Bride/Groom side
- Household members
- Total number invited
- Notes
- Invitation status
- RSVP status

---

# 27. Wedding Side

Guest households may be categorized as:

- Bride side
- Groom side
- Both/Shared

This is primarily for organization and filtering.

---

# 28. Event Invitation Rule

A major V1 business rule:

> Guests invited to a wedding are invited to all events in that wedding.

The platform will not initially support event-specific guest invitation lists.

---

# 29. Guest Accounts

Guests do not create accounts.

Guests access wedding functionality through secure invitation URLs.

Example concept:

`makemymarriage.com/w/aarav-meera/invite/ABC123`

The unique invitation link identifies the guest household.

---

# 30. Digital Invitation

The platform should generate a digital invitation experience.

It may contain:

- Bride and groom names
- Wedding photograph
- Family names
- Wedding date
- Event schedule
- Venue information
- Maps
- RSVP action
- Wedding website link

Users should be able to:

- Copy invitation link
- Share invitation link
- Generate QR code

Direct WhatsApp API messaging is outside V1.

---

# 31. RSVP

Guests should be able to RSVP without creating an account.

## RSVP options

- Attending
- Not Attending

The guest may specify:

**Number Attending**

Internal system state may additionally include:

- Awaiting Response

---

## Organiser RSVP controls

Organisers with guest-management access should be able to:

- Search households
- Filter RSVP status
- Update RSVP manually
- View number attending
- Copy invitation link
- Mark invitation sent

---

# 32. Wedding Website

Every wedding should have a public wedding website.

Example:

`makemymarriage.com/aarav-weds-meera`

No custom domain support is required initially.

---

# 33. Wedding Website Builder

Website customization should use a structured no-code builder.

Users should not receive arbitrary HTML/CSS editing.

## Customizable properties

- Theme
- Colour palette
- Typography
- Cover image
- Couple photographs
- Section order
- Section visibility

---

## Available sections

Potential website sections:

- Hero
- Couple introduction
- Our Story
- Bride
- Groom
- Family
- Events
- Venues
- Gallery
- Guestbook
- Livestream
- Contact

Users should be able to:

- Enable section
- Disable section
- Reorder section
- Edit content

---

# 34. Wedding Website Visibility

The main wedding website will be public.

Public visitors may access information intentionally published by the wedding organisers.

Gallery access is governed separately.

---

# 35. Gallery

Each wedding should have a media gallery.

## Albums

Users should be able to create albums.

Examples:

- Engagement
- Mehendi
- Haldi
- Sangeet
- Wedding
- Reception

---

## Supported content

- Images
- Videos

---

## Organiser actions

Authorized users can:

- Upload media
- Delete media
- Create album
- Edit album
- Hide media
- Approve guest uploads
- Reject guest uploads

---

# 36. Gallery Access Control

Although the wedding website is public, the gallery can be restricted.

Access should be available to invited guests who have been granted gallery access.

Gallery access should therefore be connected to the guest's invitation/access link.

Admins, Managers, and authorised Organisers can control gallery access.

---

# 37. Guest Media Upload

Guests may upload:

- Photos
- Videos

No guest account should be required.

Guest uploads should not immediately appear publicly.

Initial status:

**Pending Approval**

An authorised wedding user can:

- Approve
- Reject
- Delete

Approved content becomes visible according to gallery access rules.

---

# 38. Digital Guestbook

Guests should be able to leave wedding wishes.

Supported formats:

- Text
- Voice
- Video

Guestbook submissions should enter moderation before becoming visible publicly.

Statuses:

- Pending
- Approved
- Hidden/Rejected

Organisers should be able to manage submissions.

---

# 39. Wedding Livestream

Make My Marriage will not host livestream video itself.

Instead, authorised organisers provide a:

**YouTube Live URL**

The wedding website embeds the corresponding YouTube player.

The livestream section may contain:

- Event title
- Stream title
- Scheduled time
- YouTube stream
- Optional message

The livestream can be publicly available through the wedding website.

---

# 40. Emergency Contacts

Each wedding can maintain important contact information.

Example contacts:

- Main wedding organiser
- Family coordinator
- Venue manager
- Caterer
- Photographer
- Decorator
- Doctor
- Hospital
- Security contact

## Contact fields

- Name
- Role
- Phone
- Email
- Event
- Notes
- Priority

---

# 41. Simple Escalation / Issue Management

The platform can record urgent wedding issues without becoming a full operational incident-management tool.

## Issue fields

- Issue title
- Description
- Event
- Priority
- Assigned organiser
- Related contact
- Status
- Created time
- Resolution notes

Status:

- Open
- Resolved

Priority:

- Normal
- Important
- Urgent

---

# 42. Activity History

The system should record important actions.

Examples:

- Task created
- Task completed
- Expense created
- Payment recorded
- Vendor added
- Guest added
- RSVP received
- Document uploaded
- Team member invited
- Website updated
- Guest photo approved

Activity entries should include:

- User
- Action
- Entity
- Time

The activity log improves transparency when multiple people manage the wedding.

---

# 43. Notifications

V1 should support in-app notifications.

Notification examples:

- Task assigned
- Task due soon
- Task overdue
- Comment mention
- Payment due soon
- Payment overdue
- New RSVP
- New guest upload
- New guestbook submission
- Emergency issue assigned

Email notifications may be introduced incrementally.

WhatsApp notifications are outside V1.

---

# 44. Search

Users should be able to search important wedding information.

Searchable areas should include:

- Tasks
- Guests
- Vendors
- Expenses
- Events
- Documents

Search results should respect user permissions.

---

# 45. Filtering

Major modules should include basic filters.

Examples:

## Tasks

- Event
- Assigned person
- Status
- Priority
- Due date

## Guests

- Bride/Groom side
- RSVP status
- Invitation status

## Expenses

- Event
- Category
- Vendor
- Payment status
- Paid by

## Vendors

- Category
- Event
- Payment status

---

# 46. Documents

Documents should be attachable to relevant entities.

Supported areas include:

- Tasks
- Vendors
- Expenses
- Events

Common document examples:

- Invoice
- Contract
- Receipt
- Quotation
- Menu
- Image
- PDF

A centralized Documents section may provide access to documents across the wedding.

---

# 47. Multilingual Support

The product architecture must support localization from the beginning.

Initial mandatory languages:

- English
- Hindi

The platform should be designed so regional Indian language packs can be added without redesigning screens.

Regional language rollout can occur progressively.

User-generated content is not automatically translated.

---

# 48. Responsive Web

The initial product will be web-only.

It must work correctly on:

- Desktop
- Laptop
- Tablet
- Mobile browser

Guest-facing experiences should be designed mobile-first.

Particularly:

- Invitation
- RSVP
- Wedding website
- Gallery
- Guest upload
- Guestbook

No native Android or iOS application is required for V1.

---

# 49. Freemium Product Model

Make My Marriage will operate using a freemium model.

The system must technically support:

- Free plan
- Paid plan
- Feature entitlements
- Usage limits
- Storage limits
- Upgrade path
- Subscription status

Exact pricing is outside this PRD.

Exact Free vs Premium feature allocation should be finalized before monetization implementation.

Potential premium differentiators may include:

- Additional storage
- Additional themes
- Video uploads
- Advanced website customization
- More organisers
- Premium gallery capabilities

These are candidates, not yet locked requirements.

---

# 50. Platform Administration

Make My Marriage requires an internal platform administration interface separate from wedding administration.

Platform administrators are Make My Marriage staff.

## Internal platform functions

- View users
- View weddings
- Search users
- Search weddings
- View subscription status
- View plan
- View storage usage
- Suspend user
- Suspend wedding
- Review reported content
- View basic usage statistics

This interface should never be accessible to normal wedding users.

---

# 51. Primary User Journey

A typical new user journey should be:

### Step 1

User creates account.

### Step 2

User clicks:

**Create Wedding**

### Step 3

User provides:

- Bride
- Groom
- Wedding date
- City
- Language

### Step 4

Wedding workspace is created.

### Step 5

System suggests Hindu wedding events.

User selects:

- Mehendi
- Haldi
- Sangeet
- Wedding
- Reception

### Step 6

System generates initial wedding checklist.

### Step 7

Admin invites family members and organisers.

### Step 8

Admin assigns event responsibilities.

Example:

Rahul → Sangeet

Priya → Haldi

Bride's Father → Finance

### Step 9

Team starts completing tasks.

### Step 10

Users add vendors.

### Step 11

Users record expenses and payment instalments.

### Step 12

Users create household guest list.

### Step 13

Digital invitations are generated.

### Step 14

Guests receive invitation links.

### Step 15

Guests submit RSVP.

### Step 16

Couple customizes wedding website.

### Step 17

Wedding website is published.

### Step 18

Photos/videos and guestbook wishes are collected.

### Step 19

YouTube livestream is displayed during the wedding.

### Step 20

Wedding is eventually marked completed/archived.

---

# 52. Permission Example

Example wedding:

**Aarav & Meera**

## Aarav

Role: Admin

Access:

- Everything
- Team management

## Meera

Role: Admin

Access:

- Everything
- Team management

## Bride's Father

Role: Manager

Events:

- All

Permissions:

- Expenses
- Vendors
- Guests
- Tasks

## Priya

Role: Organiser

Events:

- Haldi
- Sangeet

Permissions:

- Tasks
- Vendors

No finance access.

## Rahul

Role: Organiser

Events:

- Sangeet

Permissions:

- Tasks only

All users see the same application design.

Features and data outside their granted access are hidden or read-restricted.

---

# 53. Core Business Rules

The following should be treated as product rules.

### BR-01

One registered user can participate in multiple weddings.

### BR-02

Every wedding operates as an independent workspace.

### BR-03

Only Admins can manage wedding team members.

### BR-04

Managers and Organisers receive permission-based access.

### BR-05

Internal users use the same primary dashboard/interface.

### BR-06

Organisers may be restricted to selected events.

### BR-07

Finance access can be independently restricted.

### BR-08

Guests do not require accounts.

### BR-09

Guests are primarily managed by household.

### BR-10

All guests belonging to a wedding are invited to all its events in V1.

### BR-11

No event-specific guest invitations exist in V1.

### BR-12

The wedding website is public.

### BR-13

Gallery access may remain restricted.

### BR-14

Guest media uploads require moderation.

### BR-15

Guestbook submissions require moderation.

### BR-16

Vendors do not receive accounts.

### BR-17

Payments can be split into instalments.

### BR-18

Payments record who paid.

### BR-19

Approval is single-step only.

### BR-20

YouTube provides livestream infrastructure.

### BR-21

The platform supports localization from day one.

### BR-22

AI is not required in V1.

---

# 54. MVP Priority

Features will be classified using:

- **P0 — Required**
- **P1 — Important**
- **P2 — Can follow after initial launch**

---

# 55. P0 — Launch Critical

P0 includes:

- Authentication
- User profile
- Wedding creation
- Wedding switching
- Wedding dashboard
- Event management
- Team invitation
- Admin/Manager/Organiser roles
- Permissions
- Event-level organiser assignment
- Task management
- Hindu wedding checklist
- Expense tracking
- Payment instalments
- Paid-by tracking
- Vendor management
- Vendor documents
- Household guest management
- Simple RSVP
- Digital invitation links
- Public wedding website
- Basic website customization
- Responsive/mobile support
- English
- Hindi

Without these capabilities, the primary planning proposition is incomplete.

---

# 56. P1 — High Value

P1 includes:

- Gallery
- Guest uploads
- Gallery moderation
- Guestbook
- Voice wishes
- Video wishes
- YouTube livestream
- Emergency contacts
- Simple escalations
- Activity history
- In-app notifications
- Search
- Advanced filters
- Centralized documents
- Additional website themes

These features materially increase the overall product value but do not block initial planning functionality.

---

# 57. P2 — Post-Launch Enhancements

Potential P2 capabilities:

- Additional regional languages
- Email reminders
- More website themes
- Advanced website customization
- Premium gallery capabilities
- Additional analytics
- Wedding export/archive
- Additional subscription controls

---

# 58. Suggested MVP Release Strategy

Rather than building all modules simultaneously, development should proceed through product milestones.

## Milestone 1 — Wedding Workspace

Deliver:

- Authentication
- Wedding creation
- Events
- Team
- Permissions
- Dashboard

---

## Milestone 2 — Planning Engine

Deliver:

- Tasks
- Checklist
- Comments
- Documents
- Notifications

---

## Milestone 3 — Money & Vendors

Deliver:

- Vendors
- Expenses
- Instalments
- Paid-by tracking
- Outstanding payments

---

## Milestone 4 — Guests

Deliver:

- Household guest management
- Invitation links
- RSVP

---

## Milestone 5 — Wedding Website

Deliver:

- Public website
- Themes
- Events
- Couple information
- Venue/maps
- Website builder

At this milestone, the core MVP can realistically be released publicly.

---

## Milestone 6 — Wedding Experience

Deliver:

- Gallery
- Guest uploads
- Guestbook
- YouTube livestream
- Emergency contacts

---

## Milestone 7 — SaaS Commercialization

Deliver:

- Free/Premium plans
- Feature limits
- Usage limits
- Subscription management
- Platform admin tools

---

# 59. Product Success Metrics

After launch, the platform should measure product usage.

## Acquisition

- New users
- Weddings created
- Invitation conversion

## Activation

Percentage of weddings that complete key setup actions:

- Create at least 3 events
- Invite at least 1 collaborator
- Create at least 5 tasks
- Add at least 10 guest households

---

## Engagement

- Active wedding workspaces
- Tasks completed
- Expenses recorded
- Vendors added
- RSVP responses
- Collaborators per wedding

---

## Wedding Website

- Websites published
- Website visitors
- RSVP conversions
- Gallery usage
- Guestbook submissions

---

## Retention

Because weddings are temporary projects, normal SaaS retention metrics require careful interpretation.

Relevant measures include:

- Weekly active wedding workspaces
- Percentage of created weddings that remain active through wedding date
- Percentage of users who later participate in another wedding

---

## Monetization

Eventually track:

- Free-to-paid conversion
- Premium weddings
- Average revenue per paid wedding
- Upgrade triggers
- Storage usage

---

# 60. Non-Functional Requirements

## Security

The platform must:

- Secure authentication
- Protect user sessions
- Enforce permissions server-side
- Prevent users from accessing other weddings
- Protect restricted galleries
- Secure invitation tokens
- Protect uploaded private documents

---

## Privacy

Public and private wedding information must be clearly differentiated.

Users should understand which content becomes publicly visible before publication.

---

## Performance

Normal pages should load quickly even for weddings containing:

- Hundreds of guests
- Hundreds of tasks
- Many expenses
- Multiple vendors

Media-heavy gallery functionality may use separate optimization techniques.

---

## Reliability

Changes to critical planning information should not be silently lost.

Examples:

- Tasks
- Expenses
- Payments
- Guests
- Vendors

---

## Accessibility

Core functionality should follow modern web accessibility practices.

Particular attention should be given to:

- Text contrast
- Keyboard usage
- Form labels
- Mobile readability

---

## Localization

Text must not be hardcoded in a way that prevents translations.

Date, currency, and number formatting must support Indian conventions.

Currency should initially use:

**₹ INR**

---

# 61. Design Principles

## Principle 1 — Keep it simple

Wedding planning is already complicated.

The product should reduce complexity rather than replicate enterprise project-management software.

---

## Principle 2 — Family friendly

Users may range from young couples to parents and older relatives.

Interfaces should therefore avoid unnecessary technical complexity.

---

## Principle 3 — Mobile friendly

Many users will access the product from mobile browsers.

Important actions should not require desktop usage.

---

## Principle 4 — Information first

The dashboard should prioritize:

- What needs attention
- What is overdue
- What is upcoming

over decorative analytics.

---

## Principle 5 — One wedding, one workspace

Wedding information should feel interconnected rather than divided into unrelated applications.

---

## Principle 6 — Collaboration without chat overload

Comments, tasks, activity history, and notifications should support collaboration without attempting to replace WhatsApp.

---

# 62. Primary Navigation

A proposed application navigation structure is:

**Dashboard**

**Events**

**Tasks**

**Guests**

**Vendors**

**Expenses**

**Documents**

**Wedding Website**

**Gallery**

**Guestbook**

**Emergency**

**Team**

**Settings**

This navigation can later be validated during UI/UX design.

---

# 63. Wedding Settings

Settings should contain:

## General

- Couple names
- Wedding date
- Wedding location
- Cover image

## Team

- Team members
- Roles
- Permissions

## Website

- URL slug
- Publication status

## Language

- Preferred interface language

## Subscription

- Current plan
- Usage
- Upgrade

## Wedding Status

- Planning
- Completed
- Archived

---

# 64. Important Product States

Wedding:

- Draft
- Planning
- Completed
- Archived

Wedding website:

- Draft
- Published

Task:

- To Do
- In Progress
- Completed

Invitation:

- Not Sent
- Sent

RSVP:

- Awaiting Response
- Attending
- Not Attending

Payment:

- Pending
- Paid
- Overdue

Guest upload:

- Pending
- Approved
- Rejected

Guestbook entry:

- Pending
- Approved
- Hidden

Emergency issue:

- Open
- Resolved

---

# 65. Product Risks

## Risk 1 — Product becomes too broad

Wedding planning can expand into dozens of adjacent problems.

Mitigation:

Strictly maintain the documented non-goals.

---

## Risk 2 — Feature overload

Parents and occasional users may find complicated project-management interfaces intimidating.

Mitigation:

Prefer simple defaults and progressive disclosure.

---

## Risk 3 — Website builder becomes its own product

Completely unrestricted customization could dramatically increase development scope.

Mitigation:

Use templates, configurable sections, colours, typography, and ordering.

---

## Risk 4 — Media costs

Guest photo/video uploads can create substantial storage and bandwidth expenses.

Mitigation:

Use configurable storage limits and premium tiers.

---

## Risk 5 — Permissions become complicated

Highly granular permission systems can become difficult for users.

Mitigation:

Use event scope plus a small number of functional permission switches.

---

## Risk 6 — Wedding lifecycle is finite

Most customers use the product intensely for several months and then stop.

Mitigation:

Encourage collaboration across family weddings and design monetization around the wedding rather than relying only on traditional monthly SaaS retention.

---

# 66. Open Business Decisions

These decisions are intentionally not locked in PRD v1.0:

1. Exact Free plan limits
2. Premium pricing
3. Premium feature list
4. Storage limits
5. Number of team members allowed on Free
6. Number of wedding website themes
7. Regional languages after Hindi
8. Exact media upload limits
9. Whether subscription is monthly, yearly, or per-wedding
10. Whether wedding archives remain accessible indefinitely

These can be decided before commercialization without changing the core product definition.

---

# 67. Future Opportunities

The following should not be implemented initially but could become future expansion areas if customer demand supports them:

- WhatsApp communication
- QR event check-in
- Travel logistics
- Hotel management
- Seating planner
- AI wedding assistant
- AI budget suggestions
- Face-based photo discovery
- Vendor discovery
- Vendor marketplace
- Planner agency accounts
- Native mobile applications
- Custom domains
- Gift/Shagun tracker
- Advanced analytics
- Wedding-day operations dashboard

Future features should only be added after validating actual user demand.

---

# 68. Final MVP Definition

The initial product succeeds if a real Indian Hindu family can:

1. Create their wedding.
2. Add all wedding ceremonies.
3. Invite family members and organisers.
4. Assign responsibilities.
5. Generate a wedding checklist.
6. Create and complete tasks.
7. Add vendors.
8. Store vendor documents.
9. Track expenses.
10. Track payment instalments.
11. See outstanding payments.
12. Add household guests.
13. Share digital invitations.
14. Collect RSVP responses.
15. Publish a wedding website.
16. Manage everything from desktop or mobile web.

The additional wedding experience features then extend this platform with:

- Gallery
- Guest uploads
- Guestbook
- Livestream
- Emergency contacts

---

# 69. Product Statement

**Make My Marriage is a collaborative digital wedding planning platform built specifically for Indian Hindu weddings, enabling couples, families, and organisers to manage ceremonies, responsibilities, guests, vendors, expenses, invitations, and the wedding's digital experience from one shared workspace.**

---

# 70. PRD Approval Baseline

The following decisions are considered locked for this PRD:

- Indian Hindu weddings are the initial target market.
- Web is the initial platform.
- The business model is freemium.
- Couple, family, and organisers are primary internal users.
- Guests do not require accounts.
- One account may participate in multiple weddings.
- The product is not a professional planner CRM.
- Admins manage wedding users.
- Managers and Organisers receive permission-based access.
- Organisers may be assigned to particular events.
- Finance access can be separately restricted.
- All internal roles use essentially the same dashboard.
- Guests are household-based.
- All invited guests are invited to all wedding events.
- Expense management remains intentionally simple.
- Instalments and outstanding payments are supported.
- Vendors do not receive accounts.
- Vendor marketplace functionality is excluded.
- Wedding websites are public.
- Website customization uses a controlled no-code builder.
- Gallery access can be restricted to invited guests.
- Guest uploads require moderation.
- Guestbook supports text, voice, and video.
- Livestreaming uses YouTube.
- AI is excluded from V1.
- WhatsApp API integration is excluded from V1.
- Native mobile applications are excluded from V1.
- Multilingual architecture is required from the beginning.
- English and Hindi are initial mandatory interface languages.