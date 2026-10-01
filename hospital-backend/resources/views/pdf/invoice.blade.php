<!doctype html>
<html><head><meta charset="utf-8"><title>{{ $invoice->invoice_number }}</title>@include('pdf._style')</head>
<body>
  <div class="head">
    <h1>Riverside General Hospital</h1>
    <div class="muted">Invoice {{ $invoice->invoice_number }} &middot; {{ $invoice->created_at->format('M j, Y') }}</div>
  </div>
  <p><strong>Patient:</strong> {{ $invoice->patient?->user?->name }}<br>
     <strong>Doctor:</strong> {{ $invoice->appointment?->doctor?->user?->name ?? '—' }}<br>
     <strong>Status:</strong> {{ strtoupper($invoice->status) }}@if($invoice->payment_method) ({{ $invoice->payment_method }})@endif</p>
  <table>
    <tr><th>Description</th><th class="right">Amount (IQD)</th></tr>
    @foreach($invoice->items ?? [] as $item)
      <tr><td>{{ $item['description'] }}</td><td class="right">{{ number_format($item['amount']) }}</td></tr>
    @endforeach
    <tr><td class="right">Discount</td><td class="right">{{ number_format($invoice->discount) }}</td></tr>
    <tr><td class="right total">Total</td><td class="right total">{{ number_format($invoice->total) }}</td></tr>
  </table>
  <p class="muted">Due {{ $invoice->due_date?->format('M j, Y') }}@if($invoice->paid_at) &middot; Paid {{ $invoice->paid_at->format('M j, Y') }}@endif</p>
</body></html>
