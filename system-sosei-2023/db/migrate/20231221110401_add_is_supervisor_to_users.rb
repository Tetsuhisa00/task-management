class AddIsSupervisorToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :is_supervisor, :boolean, default: false
  end
end
