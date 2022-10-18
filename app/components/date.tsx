type FormattedDateProps = {
  isoDate: string,
  timeZone?: string;
}

export const FormattedDate = ({ isoDate, timeZone }: FormattedDateProps) => {
  const date = Date.parse(isoDate);
  const locale = "en-US"; // TODO: use locale setting https://donavon.com/blog/remix-locale

  const formattedDate = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone,
		}).format(date);

	return <time dateTime={isoDate}>{formattedDate}</time>;
};

