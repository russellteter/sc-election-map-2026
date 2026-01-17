/**
 * VoterGuideFooter - Footer with data source attribution links
 * Links to SC Ethics Commission, SC Election Commission, and Ballotpedia
 */
export default function VoterGuideFooter() {
  return (
    <footer
      className="border-t py-6"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--card-bg)' }}
    >
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Data sourced from the{' '}
          <a
            href="https://ethicsfiling.sc.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--class-purple)' }}
          >
            SC Ethics Commission
          </a>
          ,{' '}
          <a
            href="https://scvotes.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--class-purple)' }}
          >
            SC Election Commission
          </a>
          , and{' '}
          <a
            href="https://ballotpedia.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--class-purple)' }}
          >
            Ballotpedia
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
