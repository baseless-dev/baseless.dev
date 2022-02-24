export class MailBuilder {
    onMessageSentHandler;
    build() {
        return {
            onMessageSent: this.onMessageSentHandler,
        };
    }
    onMessageSent(handler) {
        this.onMessageSentHandler = handler;
        return this;
    }
}
export const mail = new MailBuilder();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBY0EsTUFBTSxPQUFPLFdBQVc7SUFDZixvQkFBb0IsQ0FBZTtJQUtwQyxLQUFLO1FBQ1gsT0FBTztZQUNOLGFBQWEsRUFBRSxJQUFJLENBQUMsb0JBQW9CO1NBQ3hDLENBQUM7SUFDSCxDQUFDO0lBS00sYUFBYSxDQUFDLE9BQW9CO1FBQ3hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxPQUFPLENBQUM7UUFDcEMsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0NBQ0Q7QUFFRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc3NhZ2UgfSBmcm9tIFwiaHR0cHM6Ly9iYXNlbGVzcy5kZXYveC9zaGFyZWQvbWFpbC50c1wiO1xuXG5leHBvcnQgdHlwZSBNYWlsSGFuZGxlciA9IChtZXNzYWdlOiBNZXNzYWdlKSA9PiBQcm9taXNlPHZvaWQ+O1xuXG4vKipcbiAqIE1haWwgZGVzY3JpcHRvclxuICovXG5leHBvcnQgdHlwZSBNYWlsRGVzY3JpcHRvciA9IHtcblx0cmVhZG9ubHkgb25NZXNzYWdlU2VudD86IE1haWxIYW5kbGVyO1xufTtcblxuLyoqXG4gKiBNYWlsIGJ1aWxkZXJcbiAqL1xuZXhwb3J0IGNsYXNzIE1haWxCdWlsZGVyIHtcblx0cHJpdmF0ZSBvbk1lc3NhZ2VTZW50SGFuZGxlcj86IE1haWxIYW5kbGVyO1xuXG5cdC8qKlxuXHQgKiBCdWlsZCB0aGUgYXV0aCBkZXNjcmlwdG9yXG5cdCAqL1xuXHRwdWJsaWMgYnVpbGQoKTogTWFpbERlc2NyaXB0b3Ige1xuXHRcdHJldHVybiB7XG5cdFx0XHRvbk1lc3NhZ2VTZW50OiB0aGlzLm9uTWVzc2FnZVNlbnRIYW5kbGVyLFxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogU2V0IHRoZSBtZXNzYWdlIHNlbnQgaGFuZGxlclxuXHQgKi9cblx0cHVibGljIG9uTWVzc2FnZVNlbnQoaGFuZGxlcjogTWFpbEhhbmRsZXIpIHtcblx0XHR0aGlzLm9uTWVzc2FnZVNlbnRIYW5kbGVyID0gaGFuZGxlcjtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufVxuXG5leHBvcnQgY29uc3QgbWFpbCA9IG5ldyBNYWlsQnVpbGRlcigpO1xuIl19
