type FormattedDateProps = {
  isoString: string,
  timeZone?: string;
}

export const FormattedDate = ({ isoString, timeZone }: FormattedDateProps) => {
  const date = Date.parse(isoString);
  const locale = "en-US"; // TODO: use locale setting https://donavon.com/blog/remix-locale

  const formattedDate = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		timeZone,
		}).format(date);

	return <time dateTime={isoString}>{formattedDate}</time>;
};

