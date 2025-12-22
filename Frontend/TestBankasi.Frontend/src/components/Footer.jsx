// A simple functional component.
const Footer = () => {
    return (
      <footer style={styles.footer}>
        {/* DYNAMIC JAVASCRIPT:
            In React, you can inject actual JavaScript code inside curly braces { }.
            Here, 'new Date().getFullYear()' automatically prints '2025' (or whatever year it is).
            You don't need to manually update the year ever again.
        */}
        <p>
          &copy; {new Date().getFullYear()} TestBankasi Project. 
          Built with React & .NET API.<br />
          By FOMA VALERIO
        </p>
      </footer>
    );
  };
  
  const styles = {
    footer: {
      textAlign: "center",        // Centers the text
      padding: "1rem",
      backgroundColor: "#ecf0f1", // Light Grey background
      color: "#7f8c8d",           // Dark Grey text
      
      // CRITICAL LAYOUT TRICK:
      // In App.jsx, the parent container is a flex column.
      // 'marginTop: auto' tells the browser: "If there is extra empty space on the screen, 
      // put it ALL above me."
      // This forces the footer to the bottom of the screen, even if the page has very little content.
      marginTop: "auto",          
      
      borderTop: "1px solid #bdc3c7" // Adds a subtle line above the footer
    },
  };
  
  export default Footer;