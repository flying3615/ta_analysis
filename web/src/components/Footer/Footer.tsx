import "./Footer.scss";

const Footer = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <footer className="Footer" {...props}>
      {props.children}
    </footer>
  );
};

export default Footer;
