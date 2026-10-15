/**
 * CampusConnect - Indus University Data Store
 * Primary Focus: CESA (Computer Engineering Students Association)
 * Supports dual-mode: PHP/MySQL REST API or LocalStorage synchronization
 */

const CampusData = {
  // ========== CESA INFO ==========
  cesa: {
    fullName: "Computer Engineering Students Association",
    shortName: "CESA",
    university: "Indus University",
    department: "Department of Computer Engineering",
    vision: "To foster a vibrant collegiate community of computer engineering students who innovate, collaborate, and lead in global technology solutions.",
    mission: "To organize high-impact technical events, national hackathons, expert seminars, and hands-on workshops, bridging the gap between classroom theory and real-world software engineering at Indus University.",
    objectives: [
      "Promote competitive programming, algorithms, and hackathon excellence",
      "Bridge academia with Silicon Valley & IT industry leaders through expert guest sessions",
      "Organize specialized bootcamps in AI/ML, Cloud Computing, Web3, and Full-Stack Development",
      "Foster leadership, event management, and team collaboration among students",
      "Cultivate an inclusive peer-mentorship ecosystem for engineering undergraduates"
    ],
    activities: [
      "CodeSprint Flagship Hackathon",
      "AI & Cloud Computing Bootcamps",
      "Open-Source Contribution Sprints",
      "Industry Tech Speaker Series",
      "CESA Annual Technical Fest",
      "Mock Technical Interviews & Coding Rounds",
      "Peer Mentorship & Project Showcases"
    ]
  },

  // ========== CESA EXECUTIVE COMMITTEE ==========
  committee: [
    {
      id: 1,
      name: "Rohan Sharma",
      position: "President",
      department: "Computer Engineering",
      year: "4th Year",
      bio: "Leading CESA with a mission to bring cutting-edge tech bootcamps, enterprise mentorship, and flagship hackathons to Indus University students.",
      photo: "images/committee_1.jpg",
      social: { linkedin: "https://linkedin.com", email: "rohan.cesa@indus.ac.in" }
    },
    {
      id: 2,
      name: "Priya Joshi",
      position: "Vice President",
      department: "Computer Engineering",
      year: "4th Year",
      bio: "Spearheading student engagement, tech symposiums, code reviews, and corporate industry partnerships across campus.",
      photo: "images/committee_2.jpg",
      social: { linkedin: "https://linkedin.com", email: "priya.cesa@indus.ac.in" }
    },
    {
      id: 3,
      name: "Kunal Mehta",
      position: "Technical Head",
      department: "Computer Engineering",
      year: "3rd Year",
      bio: "Full-stack engineer and competitive programmer leading coding labs, open-source workshops, and problem setting for CodeSprint.",
      photo: "images/committee_1.jpg",
      social: { linkedin: "https://linkedin.com", email: "kunal.cesa@indus.ac.in" }
    },
    {
      id: 4,
      name: "Ananya Desai",
      position: "Event Head",
      department: "Computer Engineering",
      year: "3rd Year",
      bio: "Event architect coordinating stage logistics, tech panel discussions, hackathon scheduling, and student registrations.",
      photo: "images/committee_2.jpg",
      social: { linkedin: "https://linkedin.com", email: "ananya.cesa@indus.ac.in" }
    },
    {
      id: 5,
      name: "Devendra Vaghela",
      position: "Design & Media Head",
      department: "Computer Engineering",
      year: "2nd Year",
      bio: "Creative lead directing brand visual identity, event posters, web UI styling, and multimedia production for CESA.",
      photo: "images/committee_1.jpg",
      social: { linkedin: "https://linkedin.com", email: "devendra.cesa@indus.ac.in" }
    },
    {
      id: 6,
      name: "Sneha Shah",
      position: "PR & Outreach Head",
      department: "Computer Engineering",
      year: "3rd Year",
      bio: "Managing communications, student sponsorships, social media broadcasts, and alumni relations for tech events.",
      photo: "images/committee_2.jpg",
      social: { linkedin: "https://linkedin.com", email: "sneha.cesa@indus.ac.in" }
    }
  ],

  // ========== CESA EVENTS (Exclusive to CESA) ==========
  cesaEvents: [
    {
      id: "ce1",
      title: "CodeSprint 2026 — Flagship Hackathon",
      category: "Competition",
      event_type: "cesa",
      date: "2026-10-15",
      time: "09:00 AM – 06:00 PM",
      venue: "Computer Center Lab 1 & 2, Indus Campus",
      organizer: "CESA",
      status: "upcoming",
      posterImage: "posters/codesprint.jpg",
      posterText: "CodeSprint 2026",
      description: "Annual 24-hour flagship coding and algorithmic hackathon of CESA. Tackle real-world industry problems in Web3, AI, and Sustainable Tech with cash prizes worth Rs. 50,000.",
      registrationOpen: true,
      registrationDeadline: "2026-10-10",
      maxSeats: 120,
      seatsBooked: 68
    },
    {
      id: "ce2",
      title: "Hands-on AI & Cloud Computing Workshop",
      category: "Workshop",
      event_type: "cesa",
      date: "2026-10-22",
      time: "10:00 AM – 03:30 PM",
      venue: "Seminar Hall C, Indus University",
      organizer: "CESA",
      status: "upcoming",
      posterImage: "posters/ai_workshop.jpg",
      posterText: "AI & Cloud Workshop 2026",
      description: "Comprehensive hands-on workshop covering Docker containerization, AWS Lambda serverless deployments, and integrating OpenAI APIs into modern web applications.",
      registrationOpen: true,
      registrationDeadline: "2026-10-18",
      maxSeats: 80,
      seatsBooked: 52
    },
    {
      id: "ce3",
      title: "Web Dev Bootcamp: Modern MERN Stack",
      category: "Workshop",
      event_type: "cesa",
      date: "2026-11-05",
      time: "01:00 PM – 05:00 PM",
      venue: "Computer Lab 4, Block B",
      organizer: "CESA",
      status: "upcoming",
      posterImage: "posters/ai_workshop.jpg",
      posterText: "Web Dev Bootcamp 2026",
      description: "Kickstart your web development career with a fast-paced walkthrough of React, Node.js, Express, and MySQL/MongoDB database integration with hands-on project builds.",
      registrationOpen: true,
      registrationDeadline: "2026-11-01",
      maxSeats: 90,
      seatsBooked: 34
    },
    {
      id: "ce4",
      title: "CESA Tech Quiz & Fast Coding Hunt",
      category: "Competition",
      event_type: "cesa",
      date: "2026-11-24",
      time: "02:00 PM – 05:00 PM",
      venue: "Auditorium Hall 2, Indus Campus",
      organizer: "CESA",
      status: "upcoming",
      posterImage: "posters/codesprint.jpg",
      posterText: "Tech Quiz 2026",
      description: "Rapid-fire programming trivia, algorithmic puzzles, and bug-hunting rounds with team-based prizes and certificates.",
      registrationOpen: true,
      registrationDeadline: "2026-11-20",
      maxSeats: 80,
      seatsBooked: 45
    },
    {
      id: "ce5",
      title: "Indus Winter Code Jam 2026",
      category: "Competition",
      event_type: "cesa",
      date: "2026-12-04",
      time: "10:00 AM – 06:00 PM",
      venue: "Computer Center Lab 1, Indus Campus",
      organizer: "CESA",
      status: "upcoming",
      posterImage: "posters/codesprint.jpg",
      posterText: "Winter Code Jam 2026",
      description: "Full-day hackathon focused on algorithmic efficiency, real-time data streaming, and full-stack problem solving.",
      registrationOpen: true,
      registrationDeadline: "2026-11-30",
      maxSeats: 100,
      seatsBooked: 60
    }
  ],

  // ========== SEMINARS & EXPERT SESSIONS (Independent) ==========
  seminars: [
    {
      id: "sem1",
      title: "Cybersecurity & Ethical Hacking Masterclass",
      category: "Seminar",
      event_type: "seminar",
      speaker: "Dr. Sarah Chen",
      speakerTitle: "Global Cybersecurity Fellow & White Hat Researcher",
      date: "2026-10-18",
      time: "02:00 PM – 04:30 PM",
      venue: "Main University Auditorium",
      organizedBy: "Department of Computer Engineering",
      status: "upcoming",
      posterImage: "posters/cyber_seminar.jpg",
      posterText: "Cybersecurity Masterclass 2026",
      description: "In-depth university seminar exploring live vulnerability analysis, penetration testing methodologies, zero-trust architectures and cyber defense in enterprise infrastructures.",
      registrationOpen: true,
      registrationDeadline: "2026-10-16",
      maxSeats: 250,
      seatsBooked: 185
    },
    {
      id: "sem2",
      title: "From Campus to Silicon Valley: Tech Career Roadmap",
      category: "Seminar",
      event_type: "seminar",
      speaker: "Rishi Parekh",
      speakerTitle: "Staff Software Engineer, Ex-Google",
      date: "2026-10-28",
      time: "11:00 AM – 01:00 PM",
      venue: "MBA Seminar Hall, Indus University",
      organizedBy: "Training & Placement Cell",
      status: "upcoming",
      posterImage: "posters/cyber_seminar.jpg",
      posterText: "Campus to Silicon Valley 2026",
      description: "Industry career roadmap detailing system design rounds, open-source portfolio development, and cracking high-tier campus placements.",
      registrationOpen: true,
      registrationDeadline: "2026-10-26",
      maxSeats: 200,
      seatsBooked: 140
    },
    {
      id: "sem3",
      title: "Next-Gen Generative AI & LLM Systems",
      category: "Seminar",
      event_type: "seminar",
      speaker: "Dr. Amit Varma",
      speakerTitle: "AI Research Scientist & Author",
      date: "2026-11-20",
      time: "02:00 PM – 04:00 PM",
      venue: "Main University Auditorium",
      organizedBy: "Department of Computer Engineering",
      status: "upcoming",
      posterImage: "posters/cyber_seminar.jpg",
      posterText: "Generative AI Summit 2026",
      description: "Exploration of modern transformer architectures, RAG pipelines, fine-tuning techniques, and production-grade LLM applications.",
      registrationOpen: true,
      registrationDeadline: "2026-11-16",
      maxSeats: 250,
      seatsBooked: 160
    }
  ],

  // ========== GENERAL UNIVERSITY EVENTS (Independent) ==========
  generalEvents: [
    {
      id: "ge1",
      title: "Indus Campus Fiesta 2026 — Cultural & Sports Fest",
      category: "Cultural",
      event_type: "general",
      date: "2026-11-12",
      time: "10:00 AM – 10:00 PM",
      venue: "Indus Sports Complex & Open Amphitheatre",
      organizedBy: "University Student Affairs",
      status: "upcoming",
      posterImage: "posters/cultural_fest.jpg",
      posterText: "Campus Fiesta 2026",
      description: "Grand annual inter-department festival celebrating talent, battle of the bands, dance competitions, esports tournaments, cricket championships, and star evening concerts.",
      registrationOpen: true,
      registrationDeadline: "2026-11-08",
      maxSeats: 500,
      seatsBooked: 310
    },
    {
      id: "ge2",
      title: "Inter-College Box Cricket League 2026",
      category: "Sports",
      event_type: "general",
      date: "2026-11-18",
      time: "08:00 AM – 06:00 PM",
      venue: "University Cricket Grounds",
      organizedBy: "Indus Sports Club",
      status: "upcoming",
      posterImage: "posters/cultural_fest.jpg",
      posterText: "Box Cricket League 2026",
      description: "Annual 7-a-side box cricket tournament between engineering and science departments with trophies and merit medals.",
      registrationOpen: true,
      registrationDeadline: "2026-11-14",
      maxSeats: 64,
      seatsBooked: 48
    },
    {
      id: "ge3",
      title: "University Badminton & Table Tennis Tournament 2026",
      category: "Sports",
      event_type: "general",
      date: "2026-11-28",
      time: "09:00 AM – 05:00 PM",
      venue: "Indus Indoor Sports Arena",
      organizedBy: "Indus Sports Club",
      status: "upcoming",
      posterImage: "posters/cultural_fest.jpg",
      posterText: "Indoor Sports Fest 2026",
      description: "Singles and doubles knockout championships for badminton and table tennis with university sports badges.",
      registrationOpen: true,
      registrationDeadline: "2026-11-25",
      maxSeats: 80,
      seatsBooked: 52
    }
  ],

  // ========== ANNOUNCEMENTS ==========
  announcements: [
    {
      id: "ann1",
      title: "CodeSprint 2026 Problem Statements & Team Guidelines Released",
      date: "2026-10-01",
      labels: ["NEW", "IMPORTANT"],
      content: "All registered participants are requested to review the team guidelines and git repository instructions on the portal before the briefing session.",
      author: "CESA Tech Team"
    },
    {
      id: "ann2",
      title: "Last Date for Cyber Security Masterclass Passes is Oct 16",
      date: "2026-10-03",
      labels: ["DEADLINE"],
      content: "Free registration for Indus University students closes at 5 PM on October 16. Spot registrations will not be permitted due to auditorium capacity.",
      author: "Event Committee"
    },
    {
      id: "ann3",
      title: "Indus Campus Fiesta 2026 Esports & Box Cricket Registrations Now Open",
      date: "2026-10-05",
      labels: ["EVENT"],
      content: "Submit team rosters at the Student Affairs desk or register online via CampusConnect before slots fill up.",
      author: "Sports Council"
    },
    {
      id: "ann4",
      title: "Certificate of Participation Issued for Cloud Computing Bootcamp 2026",
      date: "2026-10-06",
      labels: ["NOTICE"],
      content: "Participants of the previous bootcamp can now download verifiable PDF certificates directly from their Student Dashboard.",
      author: "CESA Secretary"
    }
  ],

  // ========== DEMO STUDENTS ==========
  students: [
    {
      id: "stu1",
      name: "Aarav Patel",
      iuNumber: "IU22CE045",
      department: "Computer Engineering",
      semester: "6th Semester",
      email: "student@indus",
      phone: "+91 98765 43210",
      password: "student123"
    }
  ],

  // ========== DEMO ADMIN ==========
  admin: {
    email: "admin@indus",
    password: "admin123",
    name: "CESA Administrator"
  },

  // ========== DEMO REGISTRATIONS ==========
  registrations: [
    {
      id: "REG20261001",
      eventId: "ce1",
      eventType: "cesa",
      studentId: "stu1",
      studentName: "Aarav Patel",
      iuNumber: "IU22CE045",
      department: "Computer Engineering",
      semester: "6th Semester",
      email: "student@indus",
      phone: "+91 98765 43210",
      registeredAt: "2026-10-10T10:30:00.000Z",
      status: "confirmed"
    },
    {
      id: "REG20261002",
      eventId: "sem1",
      eventType: "seminar",
      studentId: "stu1",
      studentName: "Aarav Patel",
      iuNumber: "IU22CE045",
      department: "Computer Engineering",
      semester: "6th Semester",
      email: "student@indus",
      phone: "+91 98765 43210",
      registeredAt: "2026-10-12T14:15:00.000Z",
      status: "confirmed"
    }
  ],

  // ========== DEMO CERTIFICATES ==========
  certificates: [
    {
      id: "cert1",
      registrationId: "REG20261001",
      eventId: "ce1",
      eventTitle: "CodeSprint 2026 — Flagship Hackathon",
      studentName: "Aarav Patel",
      iuNumber: "IU22CE045",
      department: "Computer Engineering",
      issueDate: "2026-10-16",
      certificateCode: "IU-CESA-2026-0988"
    },
    {
      id: "cert2",
      registrationId: "REG20261002",
      eventId: "sem1",
      eventTitle: "Applied Deep Learning & Generative AI Masterclass",
      studentName: "Aarav Patel",
      iuNumber: "IU22CE045",
      department: "Computer Engineering",
      issueDate: "2026-10-18",
      certificateCode: "IU-CESA-2026-1042"
    }
  ]
};

// LocalStorage Helper
const Storage = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem("campusconnect_" + key);
      return data ? JSON.parse(data) : (CampusData[key] !== undefined ? CampusData[key] : defaultValue);
    } catch (e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("campusconnect_" + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("LocalStorage set error:", e);
      return false;
    }
  },
  init() {
    // Force schema upgrade to 2026 if previous cache exists
    const CURRENT_SCHEMA_VER = "2026_v3";
    const savedVer = localStorage.getItem("campusconnect_schema_version");
    if (savedVer !== CURRENT_SCHEMA_VER) {
      ["cesaEvents", "seminars", "generalEvents", "announcements", "registrations", "certificates"].forEach(key => {
        localStorage.setItem("campusconnect_" + key, JSON.stringify(CampusData[key]));
      });
      localStorage.setItem("campusconnect_schema_version", CURRENT_SCHEMA_VER);
    }

    // Populate defaults into LocalStorage if first run
    ["cesaEvents", "seminars", "generalEvents", "committee", "announcements", "students", "admin", "registrations", "certificates"].forEach(key => {
      if (!localStorage.getItem("campusconnect_" + key)) {
        localStorage.setItem("campusconnect_" + key, JSON.stringify(CampusData[key]));
      }
    });
  }
};

Storage.init();
