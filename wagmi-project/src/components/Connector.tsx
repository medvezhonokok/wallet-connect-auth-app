export const Connectors = ({connectors, handleClick}) => {
    return (<>
        {connectors.map((connector) => (
            <button
                className={'button'}
                key={connector.name}
                onClick={() => handleClick(connector)}
                type="button"
            >
                Login by {connector.name}
            </button>
        ))}
    </>)
}