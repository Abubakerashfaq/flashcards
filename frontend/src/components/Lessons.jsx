import '../css/Lessons.css';

function Lessons({ lessons }) {
    return (
        <div className="lessons-card glass">
            <h3>Lesson Schedule</h3>
            {lessons.length === 0 ? (
                <div className="lessons-empty">
                    <p>No lessons scheduled yet</p>
                </div>
            ) : (
                lessons.map(lesson => (
                    <div key={lesson.id} className="lesson-row">
                        <div className={`lesson-dot ${lesson.done ? 'done' : ''}`} />
                        <div>
                            <div className="lesson-name">{lesson.name}</div>
                            <div className="lesson-time">
                                {lesson.time} · {lesson.done ? 'Done' : 'Upcoming'}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default Lessons;