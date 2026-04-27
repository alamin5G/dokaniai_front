# List of Activity Diagrams

## User Registration & Login Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens website]
    A --> B{Already Registered?}

    B -->|No, New User| C["Enter Registration Data<br/>Phone / Email / Password"]
    C --> D[Send OTP Request]
    D --> E["System generates OTP & sends SMS"]
    E --> F[Enter OTP]
    F --> G{OTP Valid?}

    G -->|No| H[Show Error]
    H --> F

    G -->|Yes| I["Create User Account - DB"]
    I --> J[Registration Success]
    J --> K[Go to Login]
    K --> L[Enter Login Credentials]

    B -->|Yes, Existing User| L
    L --> M["Verify Credentials - DB"]
    M --> N{Valid Credentials?}

    N -->|No| O[Show Error]
    O --> L

    N -->|Yes| P[Generate JWT Token]
    P --> Q["Create Session - DB / Redis"]
    Q --> R[Login Success]
    R --> S[Go to Dashboard]
    S --> END((End))
```

## Business Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User selects Business Menu]
    A --> B{Business Exists?}

    B -->|No| C["Enter Business Info<br/>Name, Type"]
    C --> D[Validate Plan Limit]
    D --> E{Limit Exceeded?}

    E -->|Yes| F[Show Upgrade Message]
    F --> END((End))

    E -->|No| G["Create Business - DB"]
    G --> H[Business Created]
    H --> END

    B -->|Yes| I[Select Business]
    I --> J{Action Type?}

    J -->|View Business| K[Show Business Dashboard]
    K --> END

    J -->|Update Business| L[Edit Info]
    L --> M["Save Changes - DB"]
    M --> N[Update Confirmation]
    N --> END

    J -->|Delete / Archive| O[Confirm Action]
    O --> P["Archive / Delete - DB"]
    P --> Q[Update Status]
    Q --> END

    J -->|Manage Products| R[Go to Product Activity]
    R --> END
```

## Product Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User selects Product Menu]
    A --> B{Add / Update / Delete?}

    B -->|Add Product| C[Enter Product Info]
    C --> D[Assign Category]
    D --> E["Save Product - DB"]
    E --> F[Confirmation]
    F --> END((End))

    B -->|Update Product| G[Edit Info]
    G --> H["Update DB"]
    H --> I[Confirmation]
    I --> END

    B -->|Delete Product| J[Confirm Delete]
    J --> K["Remove from DB"]
    K --> L[Confirmation]
    L --> END
```

## Sales Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[Add Products to Cart]
    A --> B{Stock Available?}

    B -->|No| C[Show Out of Stock]
    C --> D[Select Another Product]
    D --> A

    B -->|Yes| E[Cart Ready]
    E --> F{Cash or Credit?}

    F -->|Cash Sale| G[Process Cash Sale]
    G --> H[Cash Sale Success]

    F -->|Credit Sale| I{Customer Exists?}

    I -->|Existing| J[Search and Select Customer]
    J --> K[Show Due Calculation]

    I -->|Phone Match| L["Phone matches existing<br/>Confirm same person?"]
    L -->|Yes| K
    L -->|No, New| M[Create New Customer]
    M --> K

    I -->|New Customer| M

    K --> N[Process Credit Sale]
    N --> O[Record Due]
    O --> P[Credit Sale Success]

    H --> END((End))
    P --> END
```

## Due & Customer Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens Customer / Due Module]
    A --> B{Customer Exists?}

    B -->|No| C["Enter Customer Info<br/>Name, Phone"]
    C --> D["Save Customer - DB"]
    D --> E[Customer Created]
    E --> F[Select Customer]

    B -->|Yes| F

    F --> G[View Customer Details]
    G --> H[View Due List / History]
    H --> I{Any Due Exists?}

    I -->|No| J["Show No Due Available"]
    J --> END((End))

    I -->|Yes| K[Select Due Entry]
    K --> L[Enter Payment Amount]
    L --> M{Full Payment?}

    M -->|Yes| N[Clear Due]
    N --> O["Update Due Status - Paid"]

    M -->|No| P[Update Remaining Due]
    P --> Q[Save Partial Payment]

    O --> R["Update Due Record - DB"]
    Q --> R
    R --> S[Show Updated Due Status]
    S --> T{Send WhatsApp Reminder?}

    T -->|Yes| U[Generate Reminder Message]
    U --> V[Send via WhatsApp]
    V --> END

    T -->|No| END
```

## Subscription, Payment & Coupon Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens Subscription Page]
    A --> B[View Available Plans]
    B --> C{Free or Paid Plan?}

    C -->|Free Trial| D[Auto Assign Free Trial]
    D --> E["Activate Free Plan"]
    E --> F[Go to Dashboard]
    F --> END((End))

    C -->|Paid Plan| G[Select Plan]
    G --> H{Apply Coupon?}

    H -->|Yes| I[Enter Coupon Code]
    I --> J[Validate Coupon]
    J --> K{Coupon Valid?}
    K -->|No| L[Show Error]
    L --> M{Retry or Skip?}
    M -->|Retry| I
    M -->|Skip| N[Continue Without Coupon]
    K -->|Yes| O[Apply Discount]
    O --> P[Calculate Final Amount]

    H -->|No| N
    N --> P

    P --> Q["Select Payment Method<br/>bKash / Nagad / Rocket"]
    Q --> R[Send Payment to Admin Number]
    R --> S[Enter TrxID]
    S --> T{Payment Verified?}

    T -->|No| U[Show Payment Failed]
    U --> V{Retry?}
    V -->|Yes| R
    V -->|No| END

    T -->|Yes| W[Activate Subscription]
    W --> X["Update Plan & Expiry"]
    X --> Y["Update Usage Limits<br/>AI Queries / Features"]
    Y --> Z["Restore Archived Data"]
    Z --> AA[Show Activation Confirmation]
    AA --> END
```

## Support Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens Support Module]
    A --> B[Create New Ticket]
    B --> C["Enter Issue Details<br/>Title, Description, Priority"]
    C --> D[Submit Ticket]
    D --> E["Save Ticket - DB"]
    E --> F[Show Ticket Confirmation]
    F --> G[View Ticket Status / History]

    G --> H{Admin Responded?}

    H -->|No| I[Wait / Refresh]
    I --> G

    H -->|Yes| J[View Admin Response]
    J --> K{Issue Resolved?}

    K -->|No| L[Add Reply / Reopen Ticket]
    L --> M["Update Ticket - DB"]
    M --> G

    K -->|Yes| N[Close Ticket]
    N --> O["Update Status - Closed"]
    O --> END((End))
```

## Report Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens Reports Module]
    A --> B["Select Report Type<br/>Sales / Expense / Due / Summary"]
    B --> C{Apply Filters?}

    C -->|Yes| D["Set Parameters<br/>Date Range, Category, etc."]
    D --> E[Fetch Data from Database]

    C -->|No| E

    E --> F[Process & Analyze Data]
    F --> G[Generate Report]
    G --> H[Display Report to User]
    H --> I{Export Report?}

    I -->|Yes| J["Select Format<br/>PDF / Excel"]
    J --> K[Download Report]
    K --> END((End))

    I -->|No| END
```

## Expense Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens Expense Module]
    A --> B[Add New Expense]
    B --> C["Enter Expense Details<br/>Type, Amount, Date, Note"]
    C --> D{Valid Data?}

    D -->|No| E[Show Error]
    E --> F[Re-enter Data]
    F --> C

    D -->|Yes| G["Save Expense - DB"]
    G --> H[Update Expense Records]
    H --> I[Show Confirmation]
    I --> J[View Expense List / History]
    J --> END((End))
```

## AI Assistant Module Flow

```mermaid
flowchart TD
    START((Start)) --> A[User opens AI Assistant]
    A --> B["Enter Query<br/>Voice / Text"]
    B --> C{Query Limit Available?}

    C -->|No| D[Show Limit Exceeded Message]
    D --> E[Suggest Upgrade Plan]
    E --> END((End))

    C -->|Yes| F[Process Query]
    F --> G["Fetch Business Data<br/>Sales, Product, etc."]
    G --> H[Generate AI Response]
    H --> I["Save Query Log"]
    I --> J[Show Response to User]
    J --> END
```

## Admin Category Request Moderation Flow

```mermaid
flowchart TD
    START((Start)) --> A[Business Owner Requests Category]
    A --> B[Check for Similar / Exact Match]

    B --> C{Match Found?}

    C -->|Exact Match| D[Suggest Existing Category]
    D --> E[Auto Reject Request]
    E --> END((End))

    C -->|Similar Exists| F[Show Suggestions to User]
    F --> G{User Confirms Request?}
    G -->|No| END
    G -->|Yes| H["Create Pending Request - DB"]

    C -->|No Match| H

    H --> I[Admin Reviews Pending Request]
    I --> J{Admin Decision?}

    J -->|Approve Global| K["Create Global Category<br/>Available to all businesses"]
    J -->|Approve Business| L["Create Business Category<br/>Only for that business"]
    J -->|Merge| M["Link to Existing Category<br/>merged_into_category_id"]
    J -->|Reject| N["Reject with Reason<br/>rejection_reason"]

    K --> O[Send Notification to Requester]
    L --> O
    M --> O
    N --> O

    O --> END
```

## Admin Coupon Management Flow

```mermaid
flowchart TD
    START((Start)) --> A[Admin opens Coupon Management]
    A --> B{Action Type?}

    B -->|Create Coupon| C["Enter Coupon Details<br/>Code, Discount Type, Amount"]
    C --> D["Set Restrictions<br/>Plan, Usage Limit, Expiry Date"]
    D --> E{Valid Data?}
    E -->|No| F[Show Error]
    F --> C
    E -->|Yes| G["Save Coupon - DB"]
    G --> H[Coupon Created Successfully]
    H --> END((End))

    B -->|Update Coupon| I[Select Existing Coupon]
    I --> J[Edit Coupon Details]
    J --> K["Update Coupon - DB"]
    K --> L[Update Confirmation]
    L --> END

    B -->|Deactivate Coupon| M[Select Active Coupon]
    M --> N[Confirm Deactivation]
    N --> O["Update Status - Inactive - DB"]
    O --> P[Coupon Deactivated]
    P --> END

    B -->|View Usage| Q[Select Coupon]
    Q --> R["Show Usage Statistics<br/>Times Used, Remaining, Revenue Impact"]
    R --> END
```
