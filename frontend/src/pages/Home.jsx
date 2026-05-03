import '../css/Home.css';
import { useNavigate } from 'react-router-dom';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">Study smarter</span>
          <h1 className="home-title">
            Be a Smart Shark
          </h1>
          <p className="home-subtitle">
            Build flashcard decks, organize them into classes, and stay on top of your study schedule.
          </p>
          <div className="home-cta-row">
            <button className="home-btn primary" onClick={() => navigate('/signup')}>
              Get started
            </button>
            <button className="home-btn secondary" onClick={() => navigate('/login')}>
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="home-features">
        <div className="home-section-header">
          <span className="home-eyebrow dark">Everything you need</span>
          <h2 className="home-section-title">Built for students</h2>
        </div>
        <div className="home-feature-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon">1</div>
            <h3 className="home-feature-title">Study</h3>
            <p className="home-feature-text">
              Flip through flashcards, mark what you know, and retry the ones you missed — all in a clean study view.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">2</div>
            <h3 className="home-feature-title">Organize</h3>
            <p className="home-feature-text">
              Group your decks into class folders with custom colors so every course has its own space.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">3</div>
            <h3 className="home-feature-title">Track progress</h3>
            <p className="home-feature-text">
              See how much of each deck you've mastered and schedule future study sessions on the built-in calendar.
            </p>
          </div>
        </div>
      </section>

      {/* Scroll stack showcase */}
      <section className="home-stack-section">
        <div className="home-section-header">
          <span className="home-eyebrow dark">How it works</span>
          <h2 className="home-section-title">Three steps to better grades</h2>
        </div>
        <ScrollStack
          useWindowScroll={true}
          itemDistance={40}
          itemStackDistance={14}
          stackPosition="22%"
          baseScale={0.92}
          itemScale={0.02}
          scaleDuration={0.6}
        >
          <ScrollStackItem>
            <div className="stack-content">
              <span className="stack-step">Step 01</span>
              <h3 className="stack-title">Create a deck</h3>
              <p className="stack-text">
                Start with a blank deck, pick a color, and add your flashcards one by one or in bulk.
              </p>
            </div>
          </ScrollStackItem>
          <ScrollStackItem>
            <div className="stack-content">
              <span className="stack-step">Step 02</span>
              <h3 className="stack-title">Group into classes</h3>
              <p className="stack-text">
                Bundle related decks into a class folder so everything for one course stays together.
              </p>
            </div>
          </ScrollStackItem>
          <ScrollStackItem>
            <div className="stack-content">
              <span className="stack-step">Step 03</span>
              <h3 className="stack-title">Study on a schedule</h3>
              <p className="stack-text">
                Drop study sessions onto the calendar and track your mastery percentage as you go.
              </p>
            </div>
          </ScrollStackItem>
        </ScrollStack>
      </section>

      {/* Reviews */}
      <section className="home-reviews">
        <div className="home-section-header">
          <span className="home-eyebrow dark">Loved by students</span>
          <h2 className="home-section-title">What people are saying</h2>
        </div>
        <div className="home-review-grid">
          <div className="home-review-card">
            <p className="home-review-text">
              "I went from scrambling the night before exams to actually feeling prepared. The class folders keep my semester from becoming chaos."
            </p>
            <div className="home-review-author">
              <div className="home-review-avatar">Jo</div>
              <div>
                <div className="home-review-name">Juan.</div>
                <div className="home-review-role">CS Major</div>
              </div>
            </div>
          </div>
          <div className="home-review-card">
            <p className="home-review-text">
              "The calendar feature is underrated. Scheduling my decks makes me actually sit down and study instead of just telling myself I will."
            </p>
            <div className="home-review-author">
              <div className="home-review-avatar">JD</div>
              <div>
                <div className="home-review-name">Other Juan</div>
                <div className="home-review-role">CS Major</div>
              </div>
            </div>
          </div>
          <div className="home-review-card">
            <p className="home-review-text">
              "Clean, simple, and doesn't try to do a million things. I just want to study my flashcards and this nails it."
            </p>
            <div className="home-review-author">
              <div className="home-review-avatar">VR</div>
              <div>
                <div className="home-review-name">Vicky R.</div>
                <div className="home-review-role">CS Major</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="home-final-cta">
        <h2 className="home-cta-title">Ready to study?</h2>
        <p className="home-cta-subtitle">Sign up free and start building your first deck today.</p>
        <button className="home-btn primary" onClick={() => navigate('/signup')}>
          Create an account
        </button>
      </section>
    </div>
  );
}

export default Home;