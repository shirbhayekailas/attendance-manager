// Converts number to Indian Currency Words (e.g., 85400 -> Rupees Eighty Five Thousand Four Hundred Only)

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function numToWordsUnderThousand(n) {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + ' ';
  }
  return str.trim();
}

export function numberToIndianCurrencyWords(amount) {
  if (amount === 0 || !amount) return 'Rupees Zero Only';

  let num = Math.round(Math.abs(amount));
  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (crore > 0) {
    result += numToWordsUnderThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += numToWordsUnderThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += numToWordsUnderThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += numToWordsUnderThousand(remainder) + ' ';
  }

  return `Rupees ${result.trim()} Only`;
}
