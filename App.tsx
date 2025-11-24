import React, { useState, useCallback } from 'react';
import { Visitor, AppView, EmailLog } from './types';
import Badge from './components/Badge';
import Modal from './components/Modal';
import { generateWelcomeEmail, generateThankYouEmail } from './services/geminiService';
import SimulatedEmailToast from './components/SimulatedEmailToast';
import QRScanner from './components/QRScanner';

// Mock initial data
const INITIAL_VISITORS: Visitor[] = [
  {
    id: 'v-123456',
    fullName: 'Alice Johnson',
    email: 'alice@techcorp.com',
    company: 'TechCorp',
    role: 'Speaker',
    registeredAt: new Date().toISOString(),
    checkedIn: false
  }
];

const EVENT_NAME = "FutureTech Summit 2025";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [lastEmail, setLastEmail] = useState<{ subject: string; body: string; to: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  
  // Registration State
  const [regForm, setRegForm] = useState({ fullName: '', email: '', company: '', role: 'Attendee' });
  const [newlyRegistered, setNewlyRegistered] = useState<Visitor | null>(null);

  // Gate Check-in State
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null); // Visitor ID
  const [badgeToPrint, setBadgeToPrint] = useState<Visitor | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Post Event State
  const [postEventHighlights, setPostEventHighlights] = useState('');
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // --- Helpers ---
  const logEmail = (visitor: Visitor, subject: string, body: string, type: 'Welcome' | 'Thank You') => {
    const newLog: EmailLog = {
      id: Math.random().toString(36).substr(2, 9),
      visitorId: visitor.id,
      recipientName: visitor.fullName,
      recipientEmail: visitor.email,
      subject,
      body,
      type,
      timestamp: new Date().toISOString(),
      status: 'Generated'
    };
    setEmailLogs(prev => [newLog, ...prev]);
  };

  const openMailClient = (email: string, subject: string, body: string) => {
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  // --- Registration Logic ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisitor: Visitor = {
      id: `v-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      ...regForm,
      registeredAt: new Date().toISOString(),
      checkedIn: false
    };
    setVisitors(prev => [newVisitor, ...prev]);
    setNewlyRegistered(newVisitor);
    setRegForm({ fullName: '', email: '', company: '', role: 'Attendee' });
  };

  // --- Gate Logic ---
  const handleCheckIn = async (visitor: Visitor) => {
    setCheckInLoading(visitor.id);
    
    try {
      // 1. Generate Welcome Email using Gemini
      const emailContent = await generateWelcomeEmail(visitor, EVENT_NAME);
      
      // 2. Log the email internally
      logEmail(visitor, emailContent.subject, emailContent.body, 'Welcome');

      // 3. Update State
      setVisitors(prev => prev.map(v => v.id === visitor.id ? { ...v, checkedIn: true, checkedInAt: new Date().toISOString() } : v));
      
      // 4. Show Notification (Simulate Send)
      setLastEmail({ ...emailContent, to: visitor.email });

      // 5. Open Badge Preview automatically for speed
      setBadgeToPrint(visitor);

    } catch (error) {
      alert("Failed to process check-in.");
    } finally {
      setCheckInLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleScan = (decodedText: string) => {
    try {
        // Attempt to parse standard event JSON format which the Badge component generates
        const data = JSON.parse(decodedText);
        if (data.id) {
            setSearchTerm(data.id);
        } else {
             setSearchTerm(decodedText);
        }
    } catch (e) {
        // Fallback for plain text QRs or other formats
        setSearchTerm(decodedText);
    }
    setShowScanner(false);
  };

  // --- Post Event Logic ---
  const handleBulkThankYou = async () => {
    setIsGeneratingBulk(true);
    const attendedVisitors = visitors.filter(v => v.checkedIn);
    
    if (attendedVisitors.length > 0) {
      // Generate one template using the first visitor context to save time/tokens
      const sampleVisitor = attendedVisitors[0];
      try {
        const baseContent = await generateThankYouEmail(sampleVisitor, EVENT_NAME, postEventHighlights || "Great networking, amazing keynote speakers");
        
        // Log for ALL attended visitors
        attendedVisitors.forEach(v => {
           // Simple replacement to personalize the bulk template
           const personalizedBody = baseContent.body.replace(sampleVisitor.fullName, v.fullName);
           logEmail(v, baseContent.subject, personalizedBody, 'Thank You');
        });

        setLastEmail({ ...baseContent, to: `${attendedVisitors.length} Recipients` });
        alert(`Generated ${attendedVisitors.length} thank you emails in the Communications tab.`);
        setView(AppView.COMMUNICATIONS);
      } catch (e) {
        console.error(e);
        alert("Failed to generate emails.");
      }
    } else {
      alert("No checked-in visitors to email.");
    }
    setIsGeneratingBulk(false);
  };

  // --- Navigation & Helper ---
  const NavItem = ({ viewName, icon, label }: { viewName: AppView, icon: string, label: string }) => (
    <button 
      onClick={() => setView(viewName)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${view === viewName ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
    >
      <i className={`fas ${icon} w-6`}></i>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col shadow-2xl print:hidden">
        <div className="p-6 border-b border-indigo-800">
          <div className="flex items-center space-x-2">
            <i className="fas fa-qrcode text-2xl text-pink-400"></i>
            <span className="text-xl font-bold tracking-tight">EventFlow</span>
          </div>
          <p className="text-xs text-indigo-300 mt-1">Gate Management System</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem viewName={AppView.DASHBOARD} icon="fa-chart-pie" label="Dashboard" />
          <NavItem viewName={AppView.REGISTRATION} icon="fa-user-plus" label="Kiosk / Register" />
          <NavItem viewName={AppView.GATE_CONTROL} icon="fa-id-card-clip" label="Gate Check-In" />
          <NavItem viewName={AppView.POST_EVENT} icon="fa-envelope-open-text" label="Post-Event" />
          <div className="pt-4 pb-2">
             <div className="border-t border-indigo-800 mx-2"></div>
          </div>
          <NavItem viewName={AppView.COMMUNICATIONS} icon="fa-paper-plane" label="Communications" />
        </nav>
        <div className="p-4 bg-indigo-950 text-xs text-center text-indigo-400">
          v1.1.0 • Connected to Gemini AI
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <header className="bg-white shadow-sm p-6 flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold text-gray-800">
            {view === AppView.DASHBOARD && 'Event Dashboard'}
            {view === AppView.REGISTRATION && 'Visitor Registration'}
            {view === AppView.GATE_CONTROL && 'Gate Control & Badging'}
            {view === AppView.POST_EVENT && 'Email Automation'}
            {view === AppView.COMMUNICATIONS && 'Email Communications Log'}
          </h1>
          <div className="flex items-center space-x-4">
             <span className="text-sm font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
               {EVENT_NAME}
             </span>
          </div>
        </header>

        <main className="p-6 print:p-0">
          
          {/* Dashboard View */}
          {view === AppView.DASHBOARD && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium">Total Registered</p>
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-bold text-gray-900 mt-1">{visitors.length}</p>
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600 mb-1">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium">Checked In</p>
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-bold text-gray-900 mt-1">{visitors.filter(v => v.checkedIn).length}</p>
                  <div className="bg-green-100 p-2 rounded-full text-green-600 mb-1">
                    <i className="fas fa-check-double"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium">Emails Generated</p>
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-bold text-gray-900 mt-1">{emailLogs.length}</p>
                  <div className="bg-purple-100 p-2 rounded-full text-purple-600 mb-1">
                    <i className="fas fa-envelope"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 font-medium">Attendance Rate</p>
                <div className="flex justify-between items-end">
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {visitors.length > 0 ? Math.round((visitors.filter(v => v.checkedIn).length / visitors.length) * 100) : 0}%
                  </p>
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600 mb-1">
                    <i className="fas fa-chart-line"></i>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Registrations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Company</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {visitors.slice(0, 5).map(v => (
                        <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-800">{v.fullName}</td>
                          <td className="py-3 text-gray-600">{v.company}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${v.checkedIn ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {v.checkedIn ? 'Inside' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 text-right text-gray-400">{new Date(v.registeredAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Registration View */}
          {view === AppView.REGISTRATION && (
            <div className="max-w-2xl mx-auto">
              {newlyRegistered ? (
                 <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-fade-in-up border border-green-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                      <i className="fas fa-check text-4xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
                    <p className="text-gray-500 mb-8">Please present this QR code at the gate.</p>
                    
                    <div className="bg-gray-50 p-6 rounded-xl inline-block border border-gray-200">
                       <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ id: newlyRegistered.id, name: newlyRegistered.fullName }))}`}
                          alt="QR Code" 
                          className="w-48 h-48 mix-blend-multiply" 
                        />
                        <p className="mt-4 font-mono font-bold text-gray-700 text-lg">{newlyRegistered.id}</p>
                    </div>

                    <div className="mt-8">
                      <button 
                        onClick={() => setNewlyRegistered(null)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Register Next Visitor
                      </button>
                    </div>
                 </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <i className="fas fa-edit mr-3 text-indigo-500"></i>
                    New Visitor Form
                  </h2>
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={regForm.fullName}
                        onChange={e => setRegForm({...regForm, fullName: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={regForm.email}
                        onChange={e => setRegForm({...regForm, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="jane@company.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                        <input 
                          required
                          type="text" 
                          value={regForm.company}
                          onChange={e => setRegForm({...regForm, company: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select 
                          value={regForm.role}
                          onChange={e => setRegForm({...regForm, role: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                        >
                          <option value="Attendee">Attendee</option>
                          <option value="VIP">VIP</option>
                          <option value="Speaker">Speaker</option>
                          <option value="Press">Press</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                      Generate Pass & QR Code
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Gate Control View */}
          {view === AppView.GATE_CONTROL && (
            <div className="h-full flex flex-col">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex space-x-4">
                <div className="relative flex-1">
                   <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                   <input 
                     type="text"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     placeholder="Scan QR or search by Name/ID..."
                     className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 flex items-center transition-colors shadow-sm"
                >
                  <i className="fas fa-camera mr-2"></i> Scan
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Visitor</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visitors
                      .filter(v => v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(visitor => (
                      <tr key={visitor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                              {visitor.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{visitor.fullName}</p>
                              <p className="text-xs text-gray-500">{visitor.company} • {visitor.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {visitor.checkedIn ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                               Checked In: {new Date(visitor.checkedInAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                               Not Arrived
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {!visitor.checkedIn ? (
                            <button 
                              onClick={() => handleCheckIn(visitor)}
                              disabled={checkInLoading === visitor.id}
                              className={`bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors ${checkInLoading === visitor.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {checkInLoading === visitor.id ? <i className="fas fa-spinner fa-spin"></i> : 'Check In & Print'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => setBadgeToPrint(visitor)}
                              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                              <i className="fas fa-print mr-1"></i> Reprint
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visitors.length === 0 && (
                   <div className="p-12 text-center text-gray-500">No visitors found.</div>
                )}
              </div>
            </div>
          )}

           {/* Post Event View */}
           {view === AppView.POST_EVENT && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-8 text-white mb-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-2">Post-Event Automation</h2>
                <p className="text-indigo-200">Generate and send AI-personalized thank you emails to all attended visitors.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Step 1: Event Highlights</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Describe the key successes of the event. Gemini will use this to write the email.
                  </p>
                  <textarea 
                    value={postEventHighlights}
                    onChange={e => setPostEventHighlights(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. Over 500 attendees, amazing keynote by Elon Musk, launch of Product X..."
                  ></textarea>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                   <div>
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Step 2: Execution</h3>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Eligible Receivers (Checked In):</span>
                      <span className="font-bold text-xl">{visitors.filter(v => v.checkedIn).length}</span>
                    </div>
                   </div>
                   
                   <button 
                     onClick={handleBulkThankYou}
                     disabled={isGeneratingBulk || visitors.filter(v => v.checkedIn).length === 0}
                     className={`w-full py-4 rounded-lg font-bold text-white shadow-lg flex items-center justify-center space-x-2 transition-all ${isGeneratingBulk ? 'bg-gray-400 cursor-wait' : 'bg-pink-600 hover:bg-pink-700 hover:-translate-y-1'}`}
                   >
                     {isGeneratingBulk ? (
                       <><i className="fas fa-spinner fa-spin"></i> <span>Processing...</span></>
                     ) : (
                       <><i className="fas fa-paper-plane"></i> <span>Generate & Send Emails</span></>
                     )}
                   </button>
                </div>
              </div>
            </div>
           )}

           {/* Communications View */}
           {view === AppView.COMMUNICATIONS && (
             <div className="flex flex-col h-full">
               <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                 <div className="flex">
                   <div className="flex-shrink-0">
                     <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                   </div>
                   <div className="ml-3">
                     <p className="text-sm text-yellow-700">
                       <span className="font-bold">Demonstration Mode:</span> Emails are generated and logged here. To actually send an email, click the "Send" button to open your default mail client.
                     </p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-200">
                     <tr>
                       <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Recipient</th>
                       <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Type</th>
                       <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Subject</th>
                       <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Generated At</th>
                       <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {emailLogs.map(log => (
                       <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4">
                           <p className="font-semibold text-gray-900">{log.recipientName}</p>
                           <p className="text-xs text-gray-500">{log.recipientEmail}</p>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.type === 'Welcome' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                             {log.type}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={log.subject}>
                           {log.subject}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500">
                           {new Date(log.timestamp).toLocaleTimeString()}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => openMailClient(log.recipientEmail, log.subject, log.body)}
                             className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors hover:text-indigo-600 hover:border-indigo-300"
                           >
                             <i className="fas fa-paper-plane mr-2"></i> Send via App
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {emailLogs.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <i className="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
                      <p>No emails generated yet.</p>
                    </div>
                 )}
               </div>
             </div>
           )}

        </main>
      </div>

      {/* Badge Print Modal */}
      <Modal 
        isOpen={!!badgeToPrint} 
        onClose={() => setBadgeToPrint(null)}
        title="Print Visitor Badge"
      >
        <div className="flex flex-col items-center">
           <div className="bg-gray-200 p-8 rounded-xl mb-6">
              {badgeToPrint && <div id="printable-area"><Badge visitor={badgeToPrint} eventName={EVENT_NAME} /></div>}
           </div>
           <div className="flex space-x-4 w-full">
             <button 
               onClick={() => setBadgeToPrint(null)}
               className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
             >
               Close
             </button>
             <button 
               onClick={handlePrint}
               className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-colors"
             >
               <i className="fas fa-print mr-2"></i> Print Now
             </button>
           </div>
        </div>
      </Modal>

      {/* QR Scanner Overlay */}
      {showScanner && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Email Toast Notification */}
      <SimulatedEmailToast 
        emailData={lastEmail} 
        onClose={() => setLastEmail(null)} 
      />

    </div>
  );
};

export default App;