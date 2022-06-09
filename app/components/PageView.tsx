import { DialogContent, DialogOverlay } from '@reach/dialog';
import { Link, useNavigate } from '@remix-run/react';
import classNames from 'classnames';
import { Fragment, cloneElement, startTransition, useEffect, useRef, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Loader, X, ZoomIn, ZoomOut } from 'react-feather';
import { Document, Page, pdfjs } from 'react-pdf';
import useMeasure from 'react-use-measure';

import { useIsomorphicLayoutEffect, useWindowEvent } from '~/hooks';

pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.js';

interface PageViewProps {
  path: string;
  next: string | undefined;
  previous: string | undefined;
  current: number;
  total: number;
}

export const PageView: React.FC<PageViewProps> = ({ path, next, previous, current, total }) => {
  let navigate = useNavigate();
  let [scale, setScale] = useState(1);
  let initialFocusRef = useRef<HTMLButtonElement>(null);

  const handleZoom = (amount: number | 'reset') => {
    startTransition(() => {
      if (amount === 'reset') {
        setScale(1);
      } else {
        setScale((prev) => prev + amount);
      }
    });
  };

  return (
    <DialogOverlay isOpen onDismiss={() => navigate('..')} className="z-20" initialFocusRef={initialFocusRef}>
      <DialogContent
        className="relative m-4 p-4 flex flex-col items-center w-auto h-[calc(100vh-2rem)] overflow-hidden rounded"
        aria-label="Page preview"
      >
        <PdfDocument key={path} path={path} scale={scale} />

        <Controls
          next={next}
          previous={previous}
          current={current}
          total={total}
          scale={scale}
          setScale={handleZoom}
          initialFocusRef={initialFocusRef}
        />
      </DialogContent>
    </DialogOverlay>
  );
};

const PdfDocument: React.FC<{ path: string; scale: number }> = ({ path, scale }) => {
  let [ready, setReady] = useState(false);
  let [wrapperRef, wrapperBounds] = useMeasure();

  let className = classNames({ visible: ready, hidden: !ready });

  return (
    <div ref={wrapperRef} className="relative h-auto min-h-full aspect-paper border rounded overflow-scroll">
      {ready ? null : <Spinner />}

      <Document file={`/api/content/${path}`} className={className}>
        <Page pageNumber={1} width={wrapperBounds.width * scale} onRenderSuccess={() => setReady(true)} />
      </Document>
    </div>
  );
};

interface ControlsProps extends Omit<PageViewProps, 'path'> {
  scale: number;
  setScale: (amount: number | 'reset') => void;
  initialFocusRef: React.RefObject<HTMLButtonElement>;
}

const Controls: React.FC<ControlsProps> = ({ next, previous, current, total, scale, setScale, initialFocusRef }) => {
  let navigate = useNavigate();

  useWindowEvent('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (previous != null) navigate(`../${previous}`);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (next != null) navigate(`../${next}`);
        break;

      case '+':
        event.preventDefault();
        setScale(+0.1);
        break;

      case '-':
        event.preventDefault();
        setScale(-0.1);
        break;

      case '0':
        event.preventDefault();
        setScale('reset');
        break;
    }
  });

  return (
    <div className="sticky bottom-4 w-auto flex items-center gap-2 mx-auto rounded-2xl border flex-none bg-white">
      <PaginationLink to={previous ? `../${previous}` : undefined} label="Previous" icon={<ChevronLeft />} />
      <span className="text-xs tabular-nums">
        {current} / {total}
      </span>
      <PaginationLink to={next ? `../${next}` : undefined} label="Next" icon={<ChevronRight />} />

      <ControlsDivider />
      <button
        ref={initialFocusRef}
        type="button"
        aria-label="Close preview"
        className={sharedButtonClassName()}
        onClick={() => navigate('..')}
      >
        <X size={14} />
      </button>
      <ControlsDivider />

      <ZoomButton label="Zoom out" icon={<ZoomOut />} onClick={() => setScale(-0.1)} />
      <span className="text-xs tabular-nums">{Math.round(scale * 100)}%</span>
      <ZoomButton label="Zoom in" icon={<ZoomIn />} onClick={() => setScale(+0.1)} />
    </div>
  );
};

let sharedButtonClassName = (active = true) =>
  classNames({
    'text-xs': true,
    'h-8 w-8 flex items-center justify-center rounded-full': true,
    'hover:text-blue-500 focus:text-blue-500 outline-none': active,
    'hover:bg-blue-100 focus:bg-blue-100': active,
  });

const PaginationLink: React.FC<{
  to: string | undefined;
  label: string;
  icon: React.ReactElement<{ size?: number }>;
}> = ({ to, label, icon }) => {
  let iconClone = cloneElement(icon, { size: 14 });

  return to ? (
    <Link to={to} aria-label={label} className={sharedButtonClassName()}>
      {iconClone}
    </Link>
  ) : (
    <span className={sharedButtonClassName(false)}>{iconClone}</span>
  );
};

const ZoomButton: React.FC<{ label: string; icon: React.ReactElement<{ size?: number }>; onClick: () => void }> = ({
  label,
  icon,
  onClick,
}) => {
  let iconClone = cloneElement(icon, { size: 14 });
  return (
    <button type="button" aria-label={label} onClick={onClick} className={sharedButtonClassName(true)}>
      {iconClone}
    </button>
  );
};

const ControlsDivider: React.FC = () => {
  return <hr className="w-px h-[calc(100%-8px)] bg-gray-200" />;
};

const Spinner: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Loader className="animate-spin" />
    </div>
  );
};
