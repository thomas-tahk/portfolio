export default function PlainPageLink() {
    return (
        <a className="plain-page-link" href={import.meta.env.BASE_URL}>
            ← Plain page
        </a>
    );
}
