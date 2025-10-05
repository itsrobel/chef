import { ChatBubbleIcon } from '@radix-ui/react-icons';
import { MenuItem } from '@ui/Menu';
import { Button } from '@ui/Button';

export function FeedbackButton({ showInMenu }: { showInMenu: boolean }) {
  const handleFeedback = async () => {
    window.open('https://github.com/get-convex/convex-backend/issues/new', '_blank');
  };

  if (showInMenu) {
    return (
      <MenuItem action={handleFeedback}>
        <ChatBubbleIcon className="text-content-secondary" />
        <span>Submit Feedback</span>
      </MenuItem>
    );
  }

  return (
    <Button variant="neutral" size="xs" className="hidden sm:flex" onClick={handleFeedback} icon={<ChatBubbleIcon />}>
      Submit Feedback
    </Button>
  );
}
