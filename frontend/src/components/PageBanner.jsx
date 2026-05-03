import '../css/PageBanner.css';

function PageBanner({ imgURL, color, title, meta, tags = [], actions }) {
    return (
        <div
            className="page-banner"
            style={imgURL ? {} : { background: color }}
        >
            {imgURL && <img src={imgURL} alt={title} className="page-banner-img" />}
            <div className="page-banner-overlay" style={
                imgURL
                    ? {}
                    : { background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 100%)' }
            } />
            <div className="page-banner-content">
                <div>
                    <h1 className="page-banner-title">{title}</h1>
                    {meta && <p className="page-banner-meta">{meta}</p>}
                    {tags.length > 0 && (
                        <div className="page-banner-tags">
                            {tags.map((tag, i) => (
                                <span key={i} className="page-banner-tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
                {actions && (
                    <div className="page-banner-actions">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PageBanner;