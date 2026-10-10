import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Monitor,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import "./ClinicDemo.css";

const initialPatients = [
  {
    id: 1,
    token: "A001",
    name: "Rahul Sharma",
    doctor: "Dr. Asha Reddy",
    reason: "Consultation",
    status: "Waiting",
    time: "09:10 AM",
  },
  {
    id: 2,
    token: "A002",
    name: "Priya Verma",
    doctor: "Dr. Asha Reddy",
    reason: "Follow-up",
    status: "Called",
    time: "09:14 AM",
  },
  {
    id: 3,
    token: "A003",
    name: "Arjun Kumar",
    doctor: "Dr. Asha Reddy",
    reason: "Ear pain",
    status: "Waiting",
    time: "09:18 AM",
  },
  {
    id: 4,
    token: "A004",
    name: "Sneha Rao",
    doctor: "Dr. Asha Reddy",
    reason: "Consultation",
    status: "Waiting",
    time: "09:21 AM",
  },
  {
    id: 5,
    token: "A005",
    name: "Vikram Singh",
    doctor: "Dr. Asha Reddy",
    reason: "Follow-up",
    status: "Completed",
    time: "09:25 AM",
  },
];

const views = [
  { id: "reception", label: "Reception", icon: Users },
  { id: "doctor", label: "Doctor's queue", icon: Stethoscope },
  { id: "patient", label: "Patient status", icon: Activity },
  { id: "display", label: "Waiting-room display", icon: Monitor },
];

export default function ClinicDemo() {
  const [patients, setPatients] = useState(initialPatients);
  const [activeView, setActiveView] = useState("reception");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(2);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    name: "",
    reason: "Consultation",
  });

  const selectedPatient = patients.find(
    (patient) => patient.id === selectedPatientId,
  );

  const waiting = patients.filter(
    (patient) => patient.status === "Waiting",
  );

  const called = patients.find(
    (patient) => patient.status === "Called",
  );

  const completed = patients.filter(
    (patient) => patient.status === "Completed",
  );

  const visiblePatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.token.toLowerCase().includes(term),
    );
  }, [patients, search]);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  function addPatient(event) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) return;

    const nextNumber =
      patients.reduce((max, patient) => {
        const number = Number(patient.token.slice(1));
        return Math.max(max, number);
      }, 0) + 1;

    const patient = {
      id: Date.now(),
      token: `A${String(nextNumber).padStart(3, "0")}`,
      name,
      doctor: "Dr. Asha Reddy",
      reason: form.reason,
      status: "Waiting",
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setPatients((current) => [...current, patient]);
    setSelectedPatientId(patient.id);
    setForm({ name: "", reason: "Consultation" });
    setShowForm(false);
    notify(`Token ${patient.token} created successfully`);
  }

  function callNext() {
    if (!waiting.length) {
      notify("No patients are waiting.");
      return;
    }

    setPatients((current) =>
      current.map((patient) =>
        patient.status === "Called"
          ? { ...patient, status: "Completed" }
          : patient.id === waiting[0].id
            ? { ...patient, status: "Called" }
            : patient,
      ),
    );

    setSelectedPatientId(waiting[0].id);
    notify(`Now calling token ${waiting[0].token}`);
  }

  function completePatient(patientId) {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? { ...patient, status: "Completed" }
          : patient,
      ),
    );

    notify("Patient marked as completed.");
  }

  function resetDemo() {
    setPatients(initialPatients);
    setSelectedPatientId(2);
    setSearch("");
    setActiveView("reception");
    notify("Demo queue has been reset.");
  }

  return (
    <div className="cq-demo">
      <header className="cq-topbar">
        <a className="cq-brand" href="/demo" aria-label="Clinic Queue demo home">
          <span className="cq-brand-icon">
            <HeartPulse size={23} />
          </span>
          <span>
            <strong>Clinic Queue</strong>
            <small>QUEUE MANAGEMENT</small>
          </span>
        </a>

        <div className="cq-topbar-right">
          <span className="cq-demo-badge">
            <span /> Interactive demo
          </span>
          <button className="cq-reset" onClick={resetDemo}>
            <RefreshCw size={15} />
            Reset
          </button>
        </div>
      </header>

      <div className="cq-workspace">
        <aside className="cq-sidebar">
          <p className="cq-nav-label">DEMO WORKSPACE</p>

          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`cq-nav-item ${activeView === id ? "active" : ""}`}
              onClick={() => setActiveView(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "reception" && (
                <span className="cq-nav-count">{waiting.length}</span>
              )}
            </button>
          ))}

          <div className="cq-sidebar-note">
            <span className="cq-note-icon">
              <HeartPulse size={18} />
            </span>
            <strong>Less waiting.<br />Better care.</strong>
            <p>A simpler way to manage your clinic's daily queue.</p>
          </div>

          <div className="cq-sidebar-footer">
            <span className="cq-avatar">CQ</span>
            <span>
              <strong>Sample Clinic</strong>
              <small>Demo environment</small>
            </span>
          </div>
        </aside>

        <main className="cq-main">
          <div className="cq-page-heading">
            <div>
              <p className="cq-eyebrow">SAMPLE CLINIC / DEMO</p>
              <h1>
                {activeView === "reception" && "Reception overview"}
                {activeView === "doctor" && "Doctor's queue"}
                {activeView === "patient" && "Patient token status"}
                {activeView === "display" && "Waiting-room display"}
              </h1>
              <p className="cq-subtitle">
                Explore how a clinic can manage patient flow in one place.
              </p>
            </div>

            {activeView === "reception" && (
              <button
                className="cq-primary-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} />
                Register patient
              </button>
            )}
          </div>

          {activeView === "reception" && (
            <>
              <section className="cq-stat-grid">
                <StatCard
                  label="Total patients"
                  value={patients.length}
                  note="Today's demo queue"
                  icon={Users}
                  kind="blue"
                />
                <StatCard
                  label="Waiting"
                  value={waiting.length}
                  note="Awaiting their turn"
                  icon={Clock3}
                  kind="amber"
                />
                <StatCard
                  label="Currently called"
                  value={called ? called.token : "—"}
                  note={called ? called.name : "No active patient"}
                  icon={Activity}
                  kind="green"
                />
                <StatCard
                  label="Completed"
                  value={completed.length}
                  note="Consultations finished"
                  icon={CheckCircle2}
                  kind="purple"
                />
              </section>

              <section className="cq-panel">
                <div className="cq-panel-heading">
                  <div>
                    <h2>Today's patient queue</h2>
                    <p>Dr. Asha Reddy · ENT consultation</p>
                  </div>

                  <label className="cq-search">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search patients..."
                    />
                  </label>
                </div>

                <QueueTable
                  patients={visiblePatients}
                  onSelect={(patient) => {
                    setSelectedPatientId(patient.id);
                    setActiveView("patient");
                  }}
                />

                <div className="cq-table-footer">
                  <span>Showing {visiblePatients.length} patients</span>
                  <span>Sample data only</span>
                </div>
              </section>

              <div className="cq-tip">
                <span className="cq-tip-icon">
                  <Activity size={19} />
                </span>
                <div>
                  <strong>Try the workflow</strong>
                  <p>
                    Register a patient, call the next token, or open the
                    waiting-room display to explore the demo.
                  </p>
                </div>
                <ArrowRight size={19} />
              </div>
            </>
          )}

          {activeView === "doctor" && (
            <section className="cq-doctor-layout">
              <div className="cq-panel cq-current-panel">
                <p className="cq-eyebrow">NOW SERVING</p>
                {called ? (
                  <>
                    <div className="cq-big-token">{called.token}</div>
                    <h2>{called.name}</h2>
                    <p>{called.reason}</p>
                    <button
                      className="cq-primary-button"
                      onClick={() => completePatient(called.id)}
                    >
                      <CheckCircle2 size={17} />
                      Complete consultation
                    </button>
                  </>
                ) : (
                  <>
                    <div className="cq-big-token">—</div>
                    <h2>No active patient</h2>
                    <p>Call the next patient when ready.</p>
                  </>
                )}

                <button className="cq-secondary-button" onClick={callNext}>
                  <ArrowRight size={17} />
                  Call next patient
                </button>
              </div>

              <div className="cq-panel">
                <div className="cq-panel-heading">
                  <div>
                    <h2>Waiting list</h2>
                    <p>{waiting.length} patients waiting</p>
                  </div>
                </div>
                <QueueTable patients={waiting} onSelect={setSelectedPatientId} />
              </div>
            </section>
          )}

          {activeView === "patient" && (
            <section className="cq-patient-layout">
              <div className="cq-panel cq-patient-card">
                <div className="cq-patient-icon">
                  <HeartPulse size={25} />
                </div>
                <p className="cq-eyebrow">SAMPLE PATIENT STATUS</p>
                <h2>Check your token</h2>
                <p className="cq-muted">
                  Choose a fictional patient to preview their status.
                </p>

                <select
                  value={selectedPatientId}
                  onChange={(event) =>
                    setSelectedPatientId(Number(event.target.value))
                  }
                >
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.token} — {patient.name}
                    </option>
                  ))}
                </select>

                {selectedPatient && (
                  <div className="cq-status-result">
                    <span className="cq-status-token">
                      {selectedPatient.token}
                    </span>
                    <StatusBadge status={selectedPatient.status} />
                    <h3>{selectedPatient.name}</h3>
                    <p>{selectedPatient.doctor}</p>
                    <div className="cq-status-message">
                      {selectedPatient.status === "Waiting" &&
                        "Please wait. Your token has been registered."}
                      {selectedPatient.status === "Called" &&
                        "It is your turn. Please proceed to the doctor."}
                      {selectedPatient.status === "Completed" &&
                        "Your consultation is complete."}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeView === "display" && (
            <section className="cq-display">
              <div className="cq-display-header">
                <div className="cq-display-logo">
                  <HeartPulse size={24} /> SAMPLE CLINIC
                </div>
                <span>ENT · TOKEN QUEUE</span>
              </div>

              <div className="cq-display-current">
                <p>CURRENTLY SERVING</p>
                <strong>{called?.token || "—"}</strong>
                <span>{called?.name || "Waiting for next patient"}</span>
              </div>

              <div className="cq-display-bottom">
                <div>
                  <p>NEXT TOKENS</p>
                  <div className="cq-next-tokens">
                    {waiting.length ? (
                      waiting.slice(0, 4).map((patient) => (
                        <span key={patient.id}>{patient.token}</span>
                      ))
                    ) : (
                      <span>No patients waiting</span>
                    )}
                  </div>
                </div>
                <div className="cq-display-doctor">
                  <Stethoscope size={21} />
                  <span>Dr. Asha Reddy</span>
                </div>
              </div>

              <p className="cq-display-caption">
                Please wait for your token to be called.
              </p>
            </section>
          )}

          <footer className="cq-footer">
            <span>Clinic Queue · Product demonstration</span>
            <span>Fictional patient data · Not for clinical use</span>
          </footer>
        </main>
      </div>

      {showForm && (
        <div
          className="cq-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <form className="cq-modal" onSubmit={addPatient}>
            <div className="cq-modal-heading">
              <div>
                <p className="cq-eyebrow">RECEPTION</p>
                <h2>Register patient</h2>
              </div>
              <button
                type="button"
                className="cq-icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Patient name
              <input
                autoFocus
                required
                maxLength={80}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter a fictional patient name"
              />
            </label>

            <label>
              Visit type
              <select
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              >
                <option>Consultation</option>
                <option>Follow-up</option>
                <option>Ear pain</option>
                <option>Hearing concern</option>
              </select>
            </label>

            <div className="cq-modal-note">
              This form only changes temporary demo data. It does not create a
              real clinic record.
            </div>

            <div className="cq-modal-actions">
              <button
                type="button"
                className="cq-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button className="cq-primary-button" type="submit">
                <Plus size={17} />
                Create token
              </button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div className="cq-toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, kind }) {
  return (
    <div className="cq-stat-card">
      <div className={`cq-stat-icon ${kind}`}>
        <Icon size={20} />
      </div>
      <span className="cq-stat-label">{label}</span>
      <strong className="cq-stat-value">{value}</strong>
      <span className="cq-stat-note">{note}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`cq-status-badge ${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  );
}

function QueueTable({ patients, onSelect }) {
  if (!patients.length) {
    return <div className="cq-empty">No patients to display.</div>;
  }

  return (
    <div className="cq-table-wrap">
      <table className="cq-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Patient</th>
            <th>Visit type</th>
            <th>Registered</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>
                <span className="cq-token-pill">{patient.token}</span>
              </td>
              <td>
                <strong>{patient.name}</strong>
                <small>{patient.doctor}</small>
              </td>
              <td>{patient.reason}</td>
              <td>{patient.time}</td>
              <td>
                <StatusBadge status={patient.status} />
              </td>
              <td>
                <button
                  className="cq-row-action"
                  onClick={() => onSelect(patient)}
                  aria-label={`View ${patient.name}`}
                >
                  <ArrowRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}